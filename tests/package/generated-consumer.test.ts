import { mkdirSync, writeFileSync } from "node:fs";
import { test } from "node:test";
import { buildPackagedConsumer } from "../helpers/packaged-consumer.js";

for (const custom of [false, true])
  test(`actual installed complete-catalog consumer ${custom ? "custom" : "default"}`, (t) => {
    const app = buildPackagedConsumer(custom);
    t.after(app.cleanup);
    const folder = ".artifacts/verification/packaged-consumer";
    mkdirSync(folder, { recursive: true });
    writeFileSync(
      `${folder}/${custom ? "custom" : "default"}-${process.pid}.json`,
      JSON.stringify(app.evidence, null, 2),
    );
  });
