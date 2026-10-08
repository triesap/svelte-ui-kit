import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildFieldConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

let consumer: ReturnType<typeof buildFieldConsumer>, hosted: FixtureServer;
test.beforeAll(async () => {
  test.setTimeout(240000);
  consumer = buildFieldConsumer(false, (root, config) => {
    const file = path.join(root, config.uiDir, "field/root.svelte"),
      source = readFileSync(file, "utf8");
    expect(source.split("return describedBy;").length).toBe(2);
    writeFileSync(
      file,
      source
        .replace("import { setContext }", "import { setContext, untrack }")
        .replace(
          "  const context: FieldContext = {",
          "  const capturedDescriptions = untrack(() => describedBy);\n  const context: FieldContext = {",
        )
        .replace("return describedBy;", "return capturedDescriptions;"),
    );
  });
  try {
    hosted = await startFixtureServer({ handler: consumer.handler });
  } catch (error) {
    consumer.cleanup();
    throw error;
  }
});
test.afterAll(async () => {
  try {
    if (hosted) {
      await hosted.server.stop();
      expect(hosted.server.failure()).toBeNull();
    }
  } finally {
    consumer?.cleanup();
  }
});
test("owned actual stale-description mutation is detected specifically after error removal", async ({
  page,
}, info) => {
  const file = info.outputPath("owned-stale-field-description.json");
  writeFileSync(
    file,
    JSON.stringify(
      {
        ...consumer.evidence,
        ownedMutation: "field-description-capture-at-construction",
      },
      null,
      2,
    ),
  );
  await info.attach("owned-stale-field-description", {
    path: file,
    contentType: "application/json",
  });
  await page.goto(
    new URL(`${consumer.route}?invalid=true`, hosted.baseURL).href,
  );
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  const missing = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("[aria-describedby]")].flatMap((node) =>
        (node.getAttribute("aria-describedby") ?? "")
          .split(" ")
          .filter((id) => id && !document.getElementById(id)),
      ),
    );
  expect(await missing()).toEqual([]);
  await page
    .getByRole("button", { name: "Toggle field invalid", exact: true })
    .click();
  await expect(page.locator("#address-message-error")).toHaveCount(0);
  await expect(page.locator("#address-control")).toHaveAttribute(
    "aria-describedby",
    "address-message-help address-message-error",
  );
  expect(await missing()).toEqual(["address-message-error"]);
});
