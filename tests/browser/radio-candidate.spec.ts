import { writeFileSync } from "node:fs";
import { buildRadioCandidate } from "../helpers/radio-candidate.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
let consumer: ReturnType<typeof buildRadioCandidate>;
let hosted: FixtureServer;
test.beforeAll(async () => {
  test.setTimeout(240000);
  consumer = buildRadioCandidate();
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
test.beforeEach(async ({ page }, info) => {
  const file = info.outputPath("radio-candidate.json");
  writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
  await info.attach("radio-candidate", {
    path: file,
    contentType: "application/json",
  });
  await page.goto(new URL(consumer.route, hosted.baseURL).href);
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
});
test("candidate binding callbacks refs snippets classes and native attrs survive", async ({
  page,
}) => {
  await expect(page.locator("#choice-a")).toBeChecked();
  await expect(page.locator("#choice-b")).not.toBeChecked();
  await expect(page.locator("#refs")).toHaveText("DIV;BUTTON;SECTION");
  await expect(page.locator("#group")).toHaveClass("kit-radio-group caller");
  await expect(page.locator("#group")).toHaveAttribute(
    "data-caller",
    "retained",
  );
  await page.locator("#choice-b").click();
  await expect(page.locator("#value")).toHaveText("b");
  await expect(page.locator("#callbacks")).toHaveText("1; clicks 0");
  await expect(
    page.locator("#choice-a [data-default-checked]"),
  ).toHaveAttribute("data-default-checked", "false");
  await page.locator("#choice-a").press("Space");
  await expect(page.locator("#value")).toHaveText("a");
  await page
    .getByRole("button", { name: "Set candidate value", exact: true })
    .click();
  await expect(page.locator("#choice-b")).toBeChecked();
  await expect(page.locator("#callbacks")).toHaveText("2; clicks 0");
  await expect(page.locator("#delegated-group")).toHaveAttribute(
    "role",
    "radiogroup",
  );
  await expect(page.locator("#delegated-b")).toBeChecked();
  await expect(page.locator("[data-delegated-checked]")).toHaveAttribute(
    "data-delegated-checked",
    "true",
  );
});
test("actual disabled and caller cancellation retain native item ordering", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Toggle choice disabled", exact: true })
    .click();
  await expect(page.locator("#choice-b")).toBeDisabled();
  await page
    .locator("#choice-b")
    .evaluate((node) => (node as HTMLButtonElement).click());
  await expect(page.locator("#value")).toHaveText("a");
  await page
    .getByRole("button", { name: "Set candidate value", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Toggle cancellation", exact: true })
    .click();
  await page.locator("#choice-a").click();
  await expect(page.locator("#value")).toHaveText("b");
  await expect(page.locator("#callbacks")).toHaveText("0; clicks 1");
});
test("candidate reset restores its native field and bound selection; raw native control records pinned limitation", async ({
  page,
}, info) => {
  await page.locator("#choice-b").click();
  await page.locator("#raw-b").click();
  await expect(page.locator("#value")).toHaveText("b");
  await expect(page.locator("#raw-value")).toHaveText("b");
  await page
    .getByRole("button", { name: "Reset candidate", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reset raw native", exact: true })
    .click();
  const observed = await page.evaluate(() => ({
    candidate: document.querySelector("#value")?.textContent,
    raw: document.querySelector("#raw-value")?.textContent,
    candidateField: (
      document.querySelector('input[name="candidate"]') as HTMLInputElement
    ).value,
    rawField: (document.querySelector('input[name="raw"]') as HTMLInputElement)
      .value,
  }));
  const file = info.outputPath("native-reset-control.json");
  writeFileSync(file, JSON.stringify(observed, null, 2));
  await info.attach("native-reset-control", {
    path: file,
    contentType: "application/json",
  });
  await expect(page.locator("#value")).toHaveText("a");
  await expect(page.locator("#choice-a")).toBeChecked();
  await expect(page.locator('input[name="candidate"]')).toHaveValue("a");
  expect(observed.raw).toBe("b");
  expect(observed.rawField).toBe("");
  await expect(page.locator('input[name="candidate"]')).toHaveCount(1);
});

test("canceled and uncanceled reset match an explicit native default value without selection callbacks", async ({
  page,
}) => {
  await page.locator("#choice-b").click();
  await page.locator("#candidate-form").evaluate((node) => {
    node.addEventListener("reset", (event) => event.preventDefault(), {
      once: true,
    });
    (node as HTMLFormElement).reset();
  });
  await expect(page.locator("#value")).toHaveText("b");
  await expect(page.locator('input[name="candidate"]')).toHaveValue("b");
  await expect(page.locator("#callbacks")).toHaveText("1; clicks 0");
  const native = await page.evaluate(() => {
    const form = document.createElement("form"),
      input = document.createElement("input");
    input.type = "text";
    input.defaultValue = "a";
    form.appendChild(input);
    document.body.appendChild(form);
    input.value = "b";
    form.reset();
    const actual = input.value;
    form.remove();
    return actual;
  });
  expect(native).toBe("a");
  await page
    .locator("#candidate-form")
    .evaluate((node) => (node as HTMLFormElement).reset());
  await expect(page.locator("#value")).toHaveText(native);
  await expect(page.locator('input[name="candidate"]')).toHaveValue(native);
  await expect(page.locator("#choice-a")).toBeChecked();
  await expect(page.locator("#callbacks")).toHaveText("1; clicks 0");
});

test("concurrent candidate SSR keeps each request and group state local", async ({
  request,
}, info) => {
  const values = Array.from(
    { length: 12 },
    (_, index) => ["a", "b", ""][index % 3]!,
  );
  const responses = await Promise.all(
    values.map(async (value) => {
      const url = new URL(consumer.route, hosted.baseURL);
      url.searchParams.set("value", value);
      const response = await request.get(url.href);
      expect(response.status()).toBe(200);
      const body = await response.text();
      for (const item of ["a", "b"]) {
        const tag = body.match(
          new RegExp(`<button(?=[^>]*id="choice-${item}")[^>]*>`),
        )?.[0];
        expect(tag).toBeTruthy();
        expect(tag).toContain(`aria-checked="${value === item}"`);
      }
      const delegated = body.match(
        /<button(?=[^>]*id="delegated-b")[^>]*>/,
      )?.[0];
      expect(delegated).toContain('aria-checked="true"');
      return { value, body };
    }),
  );
  const file = info.outputPath("candidate-ssr-requests.json");
  writeFileSync(
    file,
    JSON.stringify({ responses, artifact: consumer.evidence }, null, 2),
  );
  await info.attach("candidate-ssr-requests", {
    path: file,
    contentType: "application/json",
  });
});
