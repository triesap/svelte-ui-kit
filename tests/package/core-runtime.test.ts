import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { before, after, test } from "node:test";
import { installPackedCore } from "../helpers/packed-core.js";
import { copyCorePackage, evolveCore } from "../helpers/core-workflow.js";
import { buildCoreConsumer } from "../helpers/generated-consumer.js";

let installed: ReturnType<typeof installPackedCore>;
before(() => {
  installed = installPackedCore();
});
after(() => installed?.cleanup());
for (const custom of [false, true])
  test(`real packed installed source-free core workflow ${custom ? "custom" : "default"}`, () => {
    const pkg = copyCorePackage(installed.packageRoot);
    let consumer: ReturnType<typeof buildCoreConsumer> | undefined;
    try {
      consumer = buildCoreConsumer(
        custom,
        installed.packageRoot,
        (root, config) => evolveCore(pkg.root, root, config),
      );
      const rendered = spawnSync(
        process.execPath,
        [
          "tests/helpers/render-built-consumer.mjs",
          consumer.handler,
          `/${consumer.route}`,
        ],
        { encoding: "utf8", timeout: 30000 },
      );
      assert.equal(rendered.status, 0, rendered.stdout + rendered.stderr);
      const response = JSON.parse(rendered.stdout);
      assert.equal(response.status, 200);
      assert.match(response.body, /Actual installed complete core/);
      assert.match(response.body, /Core ready/);
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
