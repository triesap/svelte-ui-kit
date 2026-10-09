import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { buildIdentityConsumer } from "../helpers/generated-consumer.js";
import { sha256Hex } from "../../src/codegen/digest.js";

const attr = (tag: string, name: string) =>
  tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const ids = (body: string) =>
  [...body.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
for (const custom of [false, true])
  test(`actual installed identity SSR request isolation ${custom ? "custom" : "default"}`, () => {
    const consumer = buildIdentityConsumer(custom);
    try {
      const routes = Array.from(
        { length: 12 },
        (_, i) =>
          `/${consumer.route}?request=request-${i}&extra=${i % 2}&open=${i % 3 === 0 ? 1 : 0}`,
      );
      const result = spawnSync(
        process.execPath,
        [
          "tests/helpers/render-built-consumer-sequence.mjs",
          consumer.handler,
          ...routes,
        ],
        { encoding: "utf8", timeout: 90000 },
      );
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.equal(result.stderr, "");
      const responses = JSON.parse(result.stdout) as {
        handlerSha256: string;
        concurrent: { status: number; body: string }[];
        repeated: { status: number; body: string }[];
      };
      assert.equal(
        responses.handlerSha256,
        sha256Hex(readFileSync(consumer.handler)),
      );
      for (const lane of [responses.concurrent, responses.repeated]) {
        assert.equal(lane.length, 12);
        lane.forEach((response, i) => {
          assert.equal(response.status, 200);
          assert.match(
            response.body,
            new RegExp(`data-request="request-${i}"`),
          );
          assert.doesNotMatch(
            response.body,
            new RegExp(`Request request-${(i + 1) % 12} hint`),
          );
          const all = ids(response.body);
          assert.equal(
            new Set(all).size,
            all.length,
            "IDs unique within actual document",
          );
          for (const explicit of [
            "caller-field",
            "caller-control",
            "caller-switch",
            "caller-checkbox",
            "caller-radio",
            "caller-tab",
            "caller-panel",
            "caller-collapse-trigger",
            "caller-collapse-content",
            "caller-dialog-trigger",
            "caller-alert-trigger",
            "caller-menu-trigger",
          ])
            assert.ok(all.includes(explicit), explicit);
          for (const key of [
            "automatic",
            "explicit",
            ...(i % 2 ? ["conditional"] : []),
          ]) {
            const root = response.body.match(
              new RegExp(`<div[^>]*data-field="${key}"[^>]*>`),
            )![0];
            const input = response.body.match(
              new RegExp(`<input[^>]*data-control="${key}"[^>]*>`),
            )![0];
            const base = attr(root, "id")!;
            const control = attr(input, "id")!;
            assert.equal(
              control,
              key === "explicit" ? "caller-control" : `${base}-control`,
            );
            assert.match(
              response.body,
              new RegExp(`<label[^>]*for="${control}"`),
            );
            const described = attr(input, "aria-describedby")!;
            assert.equal(described, `${base}-message-hint%20%2F%20unique`);
            assert.ok(all.includes(described));
            assert.match(
              response.body.replace(/<!--[\s\S]*?-->/g, ""),
              new RegExp(
                `<p[^>]*id="${described}"[^>]*>[^<]*Request request-${i} hint`,
              ),
            );
          }
          if (i % 3 === 0) {
            for (const key of ["automatic", "explicit"]) {
              const content = response.body.match(
                new RegExp(`<div[^>]*data-overlay="dialog-${key}"[^>]*>`),
              )![0];
              assert.equal(attr(content, "role"), "dialog");
              assert.equal(attr(content, "aria-label"), `Dialog ${key}`);
              assert.match(
                response.body,
                new RegExp(`Title dialog ${key} request-${i}`),
              );
              assert.match(
                response.body,
                new RegExp(`Description dialog ${key} request-${i}`),
              );
              // Existing pinned child-registration boundary: inferred title/description
              // relationships complete in the real hydrated tree, checked by browser.
            }
          } else assert.doesNotMatch(response.body, /data-overlay="dialog-/);
        });
      }
      for (let i = 0; i < 12; i++)
        assert.deepEqual(
          ids(responses.concurrent[i]!.body),
          ids(responses.repeated[i]!.body),
          "equivalent requests reset native renderer allocation",
        );
      // Same supported tree with different request data must not advance shared counters.
      assert.deepEqual(
        ids(responses.concurrent[0]!.body),
        ids(responses.concurrent[6]!.body),
      );
      mkdirSync(".artifacts/verification/identity-ssr", {
        recursive: true,
      });
      writeFileSync(
        `.artifacts/verification/identity-ssr/${custom ? "custom" : "default"}-${process.pid}.json`,
        JSON.stringify({ evidence: consumer.evidence, responses }, null, 2),
      );
    } finally {
      consumer.cleanup();
    }
  });
