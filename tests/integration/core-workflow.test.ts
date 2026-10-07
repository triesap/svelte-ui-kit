import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { buildCoreConsumer } from "../helpers/generated-consumer.js";
import { copyCorePackage, evolveCore } from "../helpers/core-workflow.js";

for (const custom of [false, true])
  test(`complete actual core installed synthetic lifecycle ${custom ? "custom" : "default"}`, () => {
    const pkg = copyCorePackage();
    let consumer: ReturnType<typeof buildCoreConsumer> | undefined;
    try {
      consumer = buildCoreConsumer(custom, pkg.root, (root, config) =>
        evolveCore(pkg.root, root, config),
      );
      const result = spawnSync(
        process.execPath,
        [
          "tests/helpers/render-built-consumer.mjs",
          consumer.handler,
          `/${consumer.route}`,
        ],
        { encoding: "utf8", timeout: 30000 },
      );
      assert.equal(result.status, 0, result.stdout + result.stderr);
      const response = JSON.parse(result.stdout);
      assert.equal(response.status, 200);
      assert.match(response.body, /Core ready/);
      assert.match(response.body, /kit-button/);
      assert.match(response.body, /data-switch-root/);
      assert.match(response.body, /data-dialog-trigger/);
      assert.equal(
        response.handlerSha256,
        consumer.evidence.files["build/handler.js"],
      );
    } finally {
      consumer?.cleanup();
      pkg.cleanup();
    }
  });
