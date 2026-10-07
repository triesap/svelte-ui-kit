import { writeFileSync } from "node:fs";
import { buildDialogCandidate } from "../helpers/dialog-candidate.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

test.describe("actual unregistered Dialog S106 composition", () => {
  let consumer: ReturnType<typeof buildDialogCandidate>;
  let hosted: FixtureServer;
  test.beforeAll(async () => {
    test.setTimeout(240000);
    consumer = buildDialogCandidate();
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
    await page.goto(new URL("dialog-candidate", hosted.baseURL).href);
    await expect(page.locator('[data-ready="true"]')).toBeVisible();
  });
  test("explicit open binding tracks primitive and parent updates in both directions", async ({
    page,
  }) => {
    const trigger = page.locator("#trigger");
    await expect(trigger).toHaveAttribute("type", "button");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#state")).toContainText(
      "Open true; changes 1; clicks 1",
    );
    await page.locator("#close").click();
    await expect(page.locator("#state")).toContainText("Open false; changes 2");
    await page.locator("#parent-open").click();
    await expect(page.locator("#content")).toBeVisible();
    await page.locator("#parent-close").click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#content")).toHaveCount(0);
  });
  test("native keyboard activation and refs forward without duplicate handlers", async ({
    page,
  }) => {
    const trigger = page.locator("#trigger");
    await expect(trigger).toHaveClass("kit-dialog-trigger caller retained");
    await expect(trigger).toHaveAttribute("data-caller", "preserved");
    await expect(trigger).toHaveAttribute("title", "Native trigger");
    await expect(page.locator("#refs")).toHaveText("BUTTON/BUTTON");
    await trigger.press("Enter");
    await expect(page.locator("#state")).toHaveText(
      "Open true; changes 1; clicks 0; keys 1",
    );
    await page.locator("#close").click();
    await trigger.press("Space");
    await expect(page.locator("#state")).toHaveText(
      "Open true; changes 3; clicks 0; keys 2",
    );
  });
  test("caller cancellation and native disabled guard activation", async ({
    page,
  }) => {
    const trigger = page.locator("#trigger");
    await page.locator("#cancel").click();
    await trigger.click();
    await trigger.press("Enter");
    await expect(page.locator("#state")).toHaveText(
      "Open false; changes 0; clicks 1; keys 1",
    );
    await page.locator("#disable").click();
    await expect(trigger).toBeDisabled();
    await trigger.evaluate((element) => (element as HTMLButtonElement).click());
    await expect(page.locator("#state")).toHaveText(
      "Open false; changes 0; clicks 1; keys 1",
    );
  });
  test("delegated child receives actual merged native props and bound ref", async ({
    page,
  }) => {
    const trigger = page.locator("#delegated");
    await expect(trigger).toHaveAttribute("data-delegated", "actual");
    await expect(trigger).toHaveClass("kit-dialog-trigger delegated-caller");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#delegated-content")).toBeVisible();
    await page.locator("#delegated-close").click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#refs")).toHaveText("BUTTON/BUTTON");
  });
});

test.describe("actual unregistered Dialog S110 managed CSS", () => {
  let consumer: ReturnType<typeof buildDialogCandidate>;
  let hosted: FixtureServer;
  test.beforeAll(async () => {
    test.setTimeout(240000);
    consumer = buildDialogCandidate("styles");
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
    await page.locator("#style-trigger").press("Enter");
    await expect(page.locator("#style-content")).toBeVisible();
    await expect(page.locator("#style-content")).not.toHaveAttribute(
      "data-starting-style",
      "",
    );
    await expect
      .poll(() =>
        page
          .locator("#style-content")
          .evaluate(
            (element) =>
              element
                .getAnimations()
                .filter((animation) => animation.playState === "running")
                .length,
          ),
      )
      .toBe(0);
  });
  test("every design class resolves on actual parts with source defaults focus and disabled styling", async ({
    page,
  }) => {
    for (const part of [
      "trigger",
      "overlay",
      "content",
      "title",
      "description",
      "close",
    ])
      await expect(page.locator(`#style-${part}`)).toHaveClass(
        `kit-dialog-${part}`,
      );
    const style = await page.locator("#style-content").evaluate((element) => {
      const s = getComputedStyle(element);
      return {
        width: s.width,
        padding: s.padding,
        gap: s.gap,
        radius: s.borderRadius,
        background: s.backgroundColor,
        color: s.color,
        position: s.position,
      };
    });
    expect(style).toEqual({
      width: "512px",
      padding: "20px",
      gap: "16px",
      radius: "6px",
      background: "rgb(255, 255, 255)",
      color: "rgb(17, 24, 39)",
      position: "fixed",
    });
    expect(
      await page
        .locator("#style-title")
        .evaluate((element) => getComputedStyle(element).fontSize),
    ).toBe("18px");
    expect(
      await page
        .locator("#style-description")
        .evaluate((element) => getComputedStyle(element).fontSize),
    ).toBe("15px");
    expect(
      await page.locator("#disabled-close").evaluate((element) => ({
        opacity: getComputedStyle(element).opacity,
        cursor: getComputedStyle(element).cursor,
      })),
    ).toEqual({ opacity: "0.55", cursor: "not-allowed" });
    await expect(page.locator("#style-close")).toBeFocused();
    expect(
      await page.locator("#style-close").evaluate((element) => ({
        width: getComputedStyle(element).outlineWidth,
        color: getComputedStyle(element).outlineColor,
      })),
    ).toEqual({ width: "2px", color: "rgb(37, 99, 235)" });
    const overlay = await page.locator("#style-overlay").boundingBox();
    expect(overlay).toEqual({ x: 0, y: 0, width: 1280, height: 720 });
    expect(
      await page
        .locator("#style-overlay")
        .evaluate((element) => getComputedStyle(element).backgroundColor),
    ).toBe("rgba(0, 0, 0, 0)");
  });
  test("logical centered geometry, exact radius/custom hooks and reduced motion survive actual production CSS", async ({
    page,
  }) => {
    const content = page.locator("#style-content");
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
      document.documentElement.style.setProperty(
        "--kit-dialog-radius",
        "12px 18px / 20% 30%",
      );
      document.documentElement.style.setProperty(
        "--kit-dialog-max-inline-size",
        "440px",
      );
      document.documentElement.style.setProperty(
        "--kit-dialog-title-font-size",
        "21px",
      );
    });
    const box = await content.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBe(440);
    expect(box!.x + box!.width / 2).toBeCloseTo(640, 1);
    expect(box!.y + box!.height / 2).toBeCloseTo(360, 1);
    const radii = await content.evaluate((element) => {
      const s = getComputedStyle(element);
      return [
        s.borderTopLeftRadius,
        s.borderTopRightRadius,
        s.borderBottomRightRadius,
        s.borderBottomLeftRadius,
      ];
    });
    expect(radii).toEqual(["12px 20%", "18px 30%", "12px 20%", "18px 30%"]);
    expect(
      await page
        .locator("#style-title")
        .evaluate((element) => getComputedStyle(element).fontSize),
    ).toBe("21px");
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const part of ["content", "overlay"])
      expect(
        await page
          .locator(`#style-${part}`)
          .evaluate((element) => getComputedStyle(element).transitionDuration),
      ).toBe("0s");
    await page.locator("#style-close").click();
    await expect(content).toHaveCount(0);
    await expect(page.locator("#style-overlay")).toHaveCount(0);
  });
});

test.describe("actual unregistered Dialog S109 labeling composition", () => {
  let consumer: ReturnType<typeof buildDialogCandidate>;
  let hosted: FixtureServer;
  test.beforeAll(async () => {
    test.setTimeout(240000);
    consumer = buildDialogCandidate("labeling");
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
  test("actual default title and description name the native dialog and bind real refs", async ({
    page,
  }) => {
    const dialog = page.getByRole("dialog", {
      name: "Candidate accessible title",
      exact: true,
    });
    await expect(dialog).toHaveAttribute("aria-labelledby", "candidate-title");
    await expect(dialog).toHaveAttribute(
      "aria-describedby",
      "candidate-description",
    );
    await expect(page.locator("#candidate-title")).toHaveAttribute(
      "role",
      "heading",
    );
    await expect(page.locator("#candidate-title")).toHaveAttribute(
      "aria-level",
      "2",
    );
    await expect(page.locator("#candidate-title")).toHaveClass(
      "kit-dialog-title caller-title",
    );
    await expect(page.locator("#candidate-description")).toHaveClass(
      "kit-dialog-description caller-description",
    );
    await expect(page.locator("#refs")).toHaveText(
      "DIV/DIV/BUTTON/H3/P/BUTTON",
    );
  });
  test("absent and removed optional descriptions never leave an invalid native aria reference", async ({
    page,
  }) => {
    await expect(
      page.getByRole("dialog", {
        name: "Title without description",
        exact: true,
      }),
    ).not.toHaveAttribute("aria-describedby", /.+/);
    await page.locator("#toggle-description").click();
    await expect(page.locator("#candidate-description")).toHaveCount(0);
    await expect(page.locator("#default-content")).not.toHaveAttribute(
      "aria-describedby",
      /.+/,
    );
    await page.locator("#toggle-description").click();
    await expect(page.locator("#default-content")).toHaveAttribute(
      "aria-describedby",
      "candidate-description",
    );
    await expect(page.locator("#refs")).toHaveText(
      "DIV/DIV/BUTTON/H3/P/BUTTON",
    );
  });
  test("native description ID changes stay authoritative through removal and restoration", async ({
    page,
  }) => {
    await page.locator("#rename-description").click();
    await expect(page.locator("#renamed-description")).toHaveText(
      "Candidate description text",
    );
    await expect(page.locator("#default-content")).toHaveAttribute(
      "aria-describedby",
      "renamed-description",
    );
    await page.locator("#toggle-description").click();
    await expect(page.locator("#default-content")).not.toHaveAttribute(
      "aria-describedby",
      /.+/,
    );
    await page.locator("#toggle-description").click();
    await expect(page.locator("#default-content")).toHaveAttribute(
      "aria-describedby",
      "renamed-description",
    );
    await expect(page.locator("#optional-content")).not.toHaveAttribute(
      "aria-describedby",
      /.+/,
    );
  });
  test("actual Close native ref classes attributes and caller cancellation preserve primitive dismissal", async ({
    page,
  }) => {
    const close = page.locator("#candidate-close");
    await expect(close).toHaveAttribute("type", "button");
    await expect(close).toHaveAttribute("data-caller", "preserved");
    await expect(close).toHaveClass("kit-dialog-close caller-close");
    await page.locator("#cancel-close").click();
    await close.click();
    await expect(page.locator("#close-count")).toHaveText(
      "Clicks 1; open true",
    );
    await page.locator("#cancel-close").click();
    await close.press("Enter");
    await expect(page.locator("#default-content")).toHaveCount(0);
    await expect(page.locator("#close-count")).toHaveText(
      "Clicks 1; open false",
    );
  });
  test("delegated title description and close retain actual semantics ids events and refs", async ({
    page,
  }) => {
    await page.locator("#open-delegated").click();
    const dialog = page.getByRole("dialog", {
      name: "Delegated accessible title",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-labelledby", "delegated-title");
    await expect(dialog).toHaveAttribute(
      "aria-describedby",
      "delegated-description",
    );
    await expect(page.locator("#delegated-title")).toHaveAttribute(
      "aria-level",
      "3",
    );
    await expect(page.locator("#delegated-close")).toHaveAttribute(
      "type",
      "button",
    );
    await expect(page.locator("#delegated-close")).toHaveClass(
      "kit-dialog-close delegated-close",
    );
    await page.locator("#delegated-close").click();
    await expect(page.locator("#delegated-content")).toBeHidden();
    await expect(page.locator("#refs")).toHaveText(
      "DIV/DIV/BUTTON/H3/P/BUTTON",
    );
  });
});

test.describe("actual unregistered Dialog S108 Content composition", () => {
  let consumer: ReturnType<typeof buildDialogCandidate>;
  let hosted: FixtureServer;
  test.beforeAll(async () => {
    test.setTimeout(240000);
    consumer = buildDialogCandidate("content");
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
  test("default Content forwards actual native ref, classes, caller event and dismissal cancellation", async ({
    page,
  }) => {
    const content = page.locator("#default-content");
    await expect(content).toHaveClass("kit-dialog-content caller retained");
    await expect(content).toHaveAttribute("data-caller", "preserved");
    await expect(content).toHaveAttribute("role", "dialog");
    await expect(content).toHaveAttribute("data-state", "open");
    await expect(page.locator("#refs")).toHaveText("DIV/SECTION");
    await page.locator("#default-content [data-dialog-title]").click();
    await expect(page.locator("#events")).toContainText("clicks 1");
    await page.keyboard.press("Escape");
    await expect(page.locator("#events")).toContainText("Escapes 1");
    await expect(content).toBeVisible();
    await page.locator("#toggle-content").click();
    await expect(content).toHaveCount(0);
    await expect(page.locator("#refs")).toHaveText("none/SECTION");
    await expect(page.locator("#events")).toContainText("closed 1");
  });
  test("forced delegated Content carries actual props and open state across closed/open rendering", async ({
    page,
  }) => {
    const content = page.locator("#delegated-content");
    await expect(content).toHaveCount(1);
    await expect(content).toBeHidden();
    await expect(content).toHaveAttribute("data-child-open", "false");
    await expect(content).toHaveClass("kit-dialog-content delegated-caller");
    await page.locator("#toggle-delegated").click();
    await expect(content).toBeVisible();
    await expect(content).toHaveAttribute("data-child-open", "true");
    await expect(content).toHaveAttribute("data-state", "open");
    await expect(content).toHaveAttribute("role", "dialog");
    await page.locator("#toggle-delegated").click();
    await expect(content).toBeHidden();
    await expect(content).toHaveAttribute("data-state", "closed");
    await expect(page.locator("#refs")).toHaveText("DIV/SECTION");
  });
});

test.describe("actual unregistered Dialog S107 portal composition", () => {
  let consumer: ReturnType<typeof buildDialogCandidate>;
  let hosted: FixtureServer;
  test.beforeAll(async () => {
    test.setTimeout(240000);
    consumer = buildDialogCandidate("portal-overlay");
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
  test("default body, selector, actual Element and disabled inline targets retain primitive placement", async ({
    page,
  }) => {
    await expect(page.locator("body > #body-overlay")).toBeVisible();
    await expect(page.locator("body > #body-content")).toBeVisible();
    await expect(
      page.locator("#selector-target > #selector-overlay"),
    ).toBeVisible();
    await expect(
      page.locator("#selector-target > #selector-content"),
    ).toBeVisible();
    await expect(
      page.locator("#element-target > #element-overlay"),
    ).toHaveCount(1);
    await expect(
      page.locator("#element-target > #element-content"),
    ).toBeVisible();
    await expect(page.locator("#inline-host > #inline-overlay")).toHaveCount(1);
    await expect(page.locator("#inline-host > #inline-content")).toBeVisible();
    await expect(page.locator("#body-overlay")).toHaveClass(
      "kit-dialog-overlay caller",
    );
    await expect(page.locator("#body-overlay")).toHaveAttribute(
      "data-state",
      "open",
    );
  });
  test("Overlay default and delegated snippet shapes carry live state, classes and actual refs", async ({
    page,
  }) => {
    await expect(page.locator("#body-state")).toHaveText("true");
    await expect(page.locator("#selector-overlay")).toHaveAttribute(
      "data-open",
      "true",
    );
    await expect(page.locator("#selector-overlay")).toHaveClass(
      "kit-dialog-overlay delegated",
    );
    await expect(page.locator("#inline-overlay")).toHaveClass(
      "kit-dialog-overlay inline-caller",
    );
    await expect(page.locator("#inline-overlay")).toHaveAttribute(
      "data-caller",
      "preserved",
    );
    await expect(page.locator("#refs")).toHaveText("DIV/SECTION");
    await expect(page.locator("#element-overlay")).toHaveAttribute(
      "data-dialog-overlay",
      "",
    );
  });
});
