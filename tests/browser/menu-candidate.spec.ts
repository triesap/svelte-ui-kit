import { writeFileSync } from "node:fs";
import { buildMenuCandidate } from "../helpers/menu-candidate.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

test.describe("actual incremental Menu S123 composition", () => {
  let consumer: ReturnType<typeof buildMenuCandidate>;
  let hosted: FixtureServer;
  test.beforeAll(async () => {
    test.setTimeout(240000);
    consumer = buildMenuCandidate();
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
    const file = info.outputPath("candidate-artifact.json");
    writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
    await info.attach("candidate-artifact", {
      path: file,
      contentType: "application/json",
    });
    await page.goto(new URL(consumer.route, hosted.baseURL).href);
    await expect(page.locator('[data-ready="true"]')).toBeVisible();
  });
  test("pointer activation and explicit parent updates preserve controlled state", async ({
    page,
  }) => {
    const trigger = page.locator("#trigger");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#content")).toBeVisible();
    await expect(page.locator("#state")).toHaveText(
      "Open true; changes 1; pointers 1; clicks 1; keys 0",
    );
    await page.locator("#item").click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#state")).toContainText("changes 2");
    await page.locator("#parent-open").click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.locator("#parent-close").click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
  for (const key of ["Enter", "Space", "ArrowDown"]) {
    test(`native ${key} activation preserves caller handler and actual refs`, async ({
      page,
    }) => {
      const trigger = page.locator("#trigger");
      await expect(trigger).toHaveClass("kit-menu-trigger caller retained");
      await expect(trigger).toHaveAttribute("type", "button");
      await expect(trigger).toHaveAttribute("title", "Native menu trigger");
      await expect(trigger).toHaveAttribute("data-caller", "preserved");
      await expect(page.locator("#refs")).toHaveText("BUTTON/BUTTON");
      await trigger.press(key);
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator("#state")).toHaveText(
        "Open true; changes 1; pointers 0; clicks 0; keys 1",
      );
    });
  }
  test("pointer and keyboard cancellation precede native activation", async ({
    page,
  }) => {
    await page.locator("#cancel").click();
    const trigger = page.locator("#trigger");
    await trigger.click();
    await trigger.press("Enter");
    await trigger.press("Space");
    await trigger.press("ArrowDown");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#state")).toHaveText(
      "Open false; changes 0; pointers 1; clicks 1; keys 3",
    );
  });
  test("disabled native button refuses pointer and programmatic activation", async ({
    page,
  }) => {
    await page.locator("#disable").click();
    const trigger = page.locator("#trigger");
    await expect(trigger).toBeDisabled();
    await trigger.click({ force: true });
    await trigger.evaluate((element) => (element as HTMLButtonElement).click());
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#state")).toContainText("Open false; changes 0");
  });
  test("delegated props and uncontrolled default remain actual native composition", async ({
    page,
  }) => {
    const trigger = page.locator("#delegated");
    await expect(trigger).toHaveClass("kit-menu-trigger delegated-caller");
    await expect(trigger).toHaveAttribute("data-delegated", "actual");
    await trigger.click();
    await expect(page.locator("#delegated-content")).toBeVisible();
    await page.locator("#delegated-item").click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    const uncontrolled = page.locator("#uncontrolled-trigger");
    await expect(uncontrolled).toHaveAttribute("aria-expanded", "false");
    await uncontrolled.click();
    await expect(page.locator("#uncontrolled-state")).toHaveText("true");
    await page.locator("#uncontrolled-item").click();
    await expect(page.locator("#uncontrolled-state")).toHaveText("false");
    await expect(page.locator("#refs")).toHaveText("BUTTON/BUTTON");
  });
  test("initially open hydration retains candidate and direct native state", async ({
    page,
  }) => {
    await page.goto(
      new URL(`${consumer.route}?initial=open`, hosted.baseURL).href,
    );
    await expect(page.locator('[data-ready="true"]')).toBeVisible();
    await expect(page.locator("#trigger")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(page.locator("#native-trigger")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(page.locator("#content")).toBeVisible();
    await expect(page.locator("#native-content")).toBeVisible();
  });
});

test.describe("actual incremental Menu S124 floating composition", () => {
  let consumer: ReturnType<typeof buildMenuCandidate>;
  let hosted: FixtureServer;
  test.beforeAll(async () => {
    test.setTimeout(240000);
    consumer = buildMenuCandidate("content");
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
    const file = info.outputPath("candidate-artifact.json");
    writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
    await info.attach("candidate-artifact", {
      path: file,
      contentType: "application/json",
    });
    await page.goto(new URL(consumer.route, hosted.baseURL).href);
    await expect(page.locator('[data-ready="true"]')).toBeVisible();
  });
  for (const mode of ["inline", "body", "selector", "element"]) {
    test(`actual ${mode} Portal retains default floating outer and inner nodes`, async ({
      page,
    }) => {
      await page.goto(
        new URL(`${consumer.route}?portal=${mode}`, hosted.baseURL).href,
      );
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
      const content = page.locator("#default-content");
      await expect(content).toBeVisible();
      await expect(content).toHaveAccessibleName("Default floating menu");
      await expect(content).toHaveClass("kit-menu-content caller retained");
      await expect(content).toHaveAttribute("data-caller", "preserved");
      await expect(content).toHaveAttribute("data-side", "bottom");
      await expect(content).toHaveAttribute("data-align", "start");
      const structure = await content.evaluate((node) => ({
        outer: node.parentElement?.hasAttribute(
          "data-bits-floating-content-wrapper",
        ),
        position: node.parentElement?.style.position,
        transform: node.parentElement?.style.transform,
        host:
          node.parentElement?.parentElement?.id ||
          node.parentElement?.parentElement?.tagName,
        styledOuter: node.parentElement?.classList.contains("kit-menu-content"),
      }));
      expect(structure.outer).toBe(true);
      expect(structure.position).toBe("absolute");
      expect(structure.transform).toMatch(/translate/);
      expect(structure.host).toBe(
        mode === "inline" ? "MAIN" : mode === "body" ? "BODY" : "portal-host",
      );
      expect(structure.styledOuter).toBe(false);
      await expect(page.locator("#refs")).toHaveText("DIV/SECTION");
      await content.press("Escape");
      await expect(content).toBeVisible();
      await expect(page.locator("#events")).toContainText("Escapes 1");
      await page.locator("h1").click();
      await expect(content).toBeVisible();
      await expect(page.locator("#events")).toContainText("outside 1");
    });
  }
  test("delegated wrapper props keep native style attachments separate from inner props", async ({
    page,
  }) => {
    const content = page.locator("#delegated-content");
    await expect(content).toBeHidden();
    await expect(content).toHaveAttribute("data-child-open", "false");
    await page.locator("#toggle-delegated").click();
    await expect(content).toBeVisible();
    await expect(content).toHaveAttribute("data-child-open", "true");
    await expect(content).toHaveClass("kit-menu-content delegated-caller");
    const outer = content.locator("..");
    await expect(outer).toHaveAttribute("data-outer", "actual");
    await expect(outer).toHaveAttribute(
      "data-bits-floating-content-wrapper",
      "",
    );
    await expect(outer).toHaveAttribute("dir", "rtl");
    expect(
      await outer.evaluate((node) => (node as HTMLElement).style.transform),
    ).toMatch(/translate/);
    await page.locator("#toggle-delegated").click();
    await expect(content).toBeHidden();
    await expect(page.locator("#refs")).toHaveText("DIV/SECTION");
  });
  test("explicit native side align offset and strategy override source defaults", async ({
    page,
  }) => {
    await page.goto(
      new URL(`${consumer.route}?placement=custom`, hosted.baseURL).href,
    );
    const content = page.locator("#default-content");
    await expect(content).toBeVisible();
    await expect(content).toHaveAttribute("data-side", "top");
    await expect(content).toHaveAttribute("data-align", "end");
    expect(
      await content
        .locator("..")
        .evaluate((node) => (node as HTMLElement).style.position),
    ).toBe("fixed");
    await expect
      .poll(async () => {
        const anchor = await page.locator("#content-trigger").boundingBox();
        const box = await content.boundingBox();
        return anchor && box
          ? Math.abs(anchor.y - (box.y + box.height) - 12)
          : Infinity;
      })
      .toBeLessThan(1);
  });
});

test.describe("actual incremental Menu S125 item composition", () => {
  let consumer: ReturnType<typeof buildMenuCandidate>;
  let hosted: FixtureServer;
  test.beforeAll(async () => {
    test.setTimeout(240000);
    consumer = buildMenuCandidate("items");
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
    const file = info.outputPath("candidate-artifact.json");
    writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
    await info.attach("candidate-artifact", {
      path: file,
      contentType: "application/json",
    });
    await page.goto(new URL(consumer.route, hosted.baseURL).href);
    await expect(page.locator('[data-ready="true"]')).toBeVisible();
  });
  test("actual item group radio and indicator refs classes roles and child props survive", async ({
    page,
  }) => {
    await expect(page.locator("#refs")).toHaveText(
      "DIV/DIV/DIV/SPAN/SECTION/SECTION/DIV",
    );
    await expect(page.locator("#ordinary")).toHaveClass(
      "kit-menu-item caller-item",
    );
    await expect(page.locator("#ordinary")).toHaveAttribute(
      "data-caller",
      "ordinary",
    );
    await expect(page.locator("#group")).toHaveClass(
      "kit-menu-radio-group caller-group",
    );
    await expect(page.locator("#alpha")).toHaveClass(
      "kit-menu-item kit-menu-radio-item caller-radio",
    );
    await expect(page.locator("#alpha")).toHaveAttribute(
      "role",
      "menuitemradio",
    );
    await expect(page.locator("#alpha-indicator")).toHaveClass(
      "kit-menu-item-indicator caller-indicator",
    );
    await expect(page.locator("#alpha-indicator")).toBeVisible();
    await expect(page.locator("#beta-indicator")).toBeHidden();
    await expect(page.locator("#delegated")).toHaveAttribute(
      "data-delegated",
      "item",
    );
    await expect(page.locator("#beta")).toHaveAttribute(
      "data-delegated",
      "radio",
    );
    await expect(page.locator("#delegated-group")).toHaveAttribute(
      "data-delegated",
      "group",
    );
  });
  test("controlled selection callback bind value parent updates and actual checked snippets agree", async ({
    page,
  }) => {
    await page.locator("#beta").click();
    await expect(page.locator("#state")).toHaveText(
      "Open true; value beta; selected 1; changed 1",
    );
    await expect(page.locator("#beta")).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("#beta-indicator")).toBeVisible();
    await expect(page.locator("#alpha-indicator")).toBeHidden();
    await page.locator("#alpha").click();
    await expect(page.locator("#state")).toHaveText(
      "Open true; value alpha; selected 2; changed 2",
    );
    await page.locator("#parent-value").click();
    await expect(page.locator("#beta")).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("#state")).toContainText(
      "value beta; selected 2; changed 2",
    );
  });
  test("caller selection cancellation preserves group value and native open", async ({
    page,
  }) => {
    await page.locator("#cancel").click();
    await page.locator("#beta").click();
    await page.locator("#closing").click();
    await expect(page.locator("#state")).toHaveText(
      "Open true; value alpha; selected 2; changed 0",
    );
    await expect(page.locator("#alpha-indicator")).toBeVisible();
    await expect(page.locator("#beta-indicator")).toBeHidden();
  });
  test("disabled ordinary and radio items refuse selection", async ({
    page,
  }) => {
    await page.locator("#disabled").click({ force: true });
    await page.locator("#disabled-radio").click({ force: true });
    await expect(page.locator("#state")).toHaveText(
      "Open true; value alpha; selected 0; changed 0",
    );
    await expect(page.locator("#disabled-radio")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
  test("delegated ordinary and uncontrolled group preserve native selection then default close", async ({
    page,
  }) => {
    await page.locator("#delegated").click();
    await expect(page.locator("#state")).toHaveText(
      "Open true; value alpha; selected 1; changed 0",
    );
    await expect(page.locator("#uncontrolled-indicator")).toBeHidden();
    await page.locator("#delegated-radio").click();
    await expect(page.locator("#delegated-radio")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#uncontrolled-indicator")).toBeVisible();
    await page.locator("#closing").click();
    await expect(page.locator("#state")).toContainText("Open false");
    await expect(page.locator("#content")).toHaveCount(0);
  });
});
