import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { test } from "node:test";
import { buildMenuConsumer } from "../helpers/generated-consumer.js";
for (const custom of [false, true])
  test(`installed Menu same-worker SSR request isolation ${custom ? "custom" : "default"}`, () => {
    const consumer = buildMenuConsumer(custom, "menu-placement");
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
      mkdirSync(".artifacts/verification/menu-ssr", { recursive: true });
      writeFileSync(
        `.artifacts/verification/menu-ssr/${custom ? "custom" : "default"}-${process.pid}.json`,
        JSON.stringify({ evidence: consumer.evidence, responses }, null, 2),
      );
      assert.equal(
        responses.handlerSha256,
        consumer.evidence.files["build/handler.js"],
      );
      for (const lane of [responses.concurrent, responses.repeated]) {
        assert.equal(lane.length, routes.length);
        assert.equal(lane.at(-1)!.status, 200);
        assert.match(lane.at(-1)!.body, /role="menu"/);
        for (const [index, { initial, portal }] of inputs.entries()) {
          const response = lane[index]!;
          assert.equal(response.status, 200);
          assert.match(response.body, new RegExp(`data-initial="${initial}"`));
          const first = response.body.match(
            /<button[^>]*id="placement-trigger"[^>]*>/,
          )?.[0];
          assert.ok(first);
          assert.match(
            first,
            new RegExp(`aria-expanded="${initial === "open"}"`),
          );
          const second = response.body.match(
            /<button[^>]*id="second-trigger"[^>]*>/,
          )?.[0];
          assert.ok(second);
          assert.match(second, /aria-expanded="false"/);
          const ids = [...response.body.matchAll(/\bid="([^"]+)"/g)].map(
            (m) => m[1],
          );
          assert.equal(new Set(ids).size, ids.length);
          const content = response.body.match(
            /<div[^>]*id="placement-content"[^>]*>/,
          )?.[0];
          assert.equal(
            Boolean(content),
            portal === "inline" && initial === "open",
          );
          if (content) {
            assert.match(content, /role="menu"/);
            assert.match(response.body, /Dynamic choice/);
            assert.match(content, /data-state="open"/);
          }
        }
      }
    } finally {
      consumer.cleanup();
    }
  });
