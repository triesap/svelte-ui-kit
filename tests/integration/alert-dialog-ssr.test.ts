import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { test } from "node:test";
import { buildAlertDialogConsumer } from "../helpers/generated-consumer.js";

for (const custom of [false, true])
  test(`actual installed AlertDialog production SSR request isolation ${custom ? "custom" : "default"}`, () => {
    const consumer = buildAlertDialogConsumer(custom, "alert-dialog-hydration");
    try {
      const inputs = ["open", "closed", "open"].flatMap((initial) =>
        ["inline", "body", "custom"].map((portal) => ({ initial, portal })),
      );
      const routes = inputs.map(
        ({ initial, portal }) =>
          `/${consumer.route}?initial=${initial}&portal=${portal}`,
      );
      routes.push(`/${consumer.route}?initial=open&portal=inline&native=1`);
      const result = spawnSync(
        process.execPath,
        [
          "tests/helpers/render-built-consumer-sequence.mjs",
          consumer.handler,
          ...routes,
        ],
        { encoding: "utf8", timeout: 60000 },
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
        consumer.evidence.files["build/handler.js"],
      );
      mkdirSync(".artifacts/verification/alert-dialog-ssr", {
        recursive: true,
      });
      writeFileSync(
        `.artifacts/verification/alert-dialog-ssr/${custom ? "custom" : "default"}-${process.pid}.json`,
        JSON.stringify({ evidence: consumer.evidence, responses }, null, 2),
      );
      for (const lane of [responses.concurrent, responses.repeated]) {
        assert.equal(lane.length, routes.length);
        const native = lane.at(-1)!;
        assert.equal(native.status, 200);
        const nativeContent = native.body.match(
          /<div\b[^>]*data-alert-dialog-content[^>]*>/,
        )?.[0];
        assert.ok(nativeContent);
        // Content props are rendered before child registration on the server.
        // The direct pinned control owns the exact supported relation boundary.
        const nativeRelations = ["aria-labelledby", "aria-describedby"].map(
          (attr) =>
            nativeContent.match(new RegExp(`${attr}="([^"]+)"`))?.[1] ?? null,
        );
        for (const [index, { initial, portal }] of inputs.entries()) {
          const response = lane[index]!;
          assert.equal(response.status, 200);
          assert.ok(response.body.includes(`data-initial="${initial}"`));
          const triggers = [
            ...response.body.matchAll(
              /<button\b[^>]*data-alert-dialog-trigger[^>]*>/g,
            ),
          ].map((m) => m[0]);
          assert.equal(triggers.length, 2);
          assert.match(
            triggers[0]!,
            new RegExp(`aria-expanded="${initial === "open"}"`),
          );
          assert.match(triggers[1]!, /aria-expanded="false"/);
          const ids = [...response.body.matchAll(/\bid="([^"]+)"/g)].map(
            (m) => m[1],
          );
          assert.equal(new Set(ids).size, ids.length);
          const contents = [
            ...response.body.matchAll(
              /<div\b[^>]*data-alert-dialog-content[^>]*>/g,
            ),
          ].map((m) => m[0]);
          if (portal === "inline" && initial === "open") {
            assert.equal(contents.length, 1);
            assert.match(contents[0]!, /role="alertdialog"/);
            const relations = ["aria-labelledby", "aria-describedby"].map(
              (attr) =>
                contents[0]!.match(new RegExp(`${attr}="([^"]+)"`))?.[1] ??
                null,
            );
            assert.deepEqual(relations, nativeRelations);
            assert.match(response.body, /First request-local dialog/);
            assert.match(response.body, /First request-local description/);
            for (const part of ["title", "description"]) {
              const id = response.body.match(
                new RegExp(
                  `<[^>]+id="([^"]+)"[^>]+data-alert-dialog-${part}[^>]*>`,
                ),
              )?.[1];
              assert.ok(id, part);
              assert.ok(ids.includes(id));
            }
          } else
            assert.equal(
              contents.length,
              0,
              "native server portal omits browser-only content",
            );
        }
      }
      mkdirSync(".artifacts/verification/alert-dialog-ssr", {
        recursive: true,
      });
      writeFileSync(
        `.artifacts/verification/alert-dialog-ssr/${custom ? "custom" : "default"}-${process.pid}.json`,
        JSON.stringify({ evidence: consumer.evidence, responses }, null, 2),
      );
    } finally {
      consumer.cleanup();
    }
  });
