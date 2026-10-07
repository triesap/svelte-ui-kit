import { readFileSync, writeFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { test, expect } from "./browser-issues";
import { startFixtureServer, type OwnedServer } from "./fixture-server";

const properties: { name: string; scope: string; fallback: string }[] =
  JSON.parse(
    readFileSync("registry/contracts/component-customization-v1.json", "utf8"),
  ).properties.filter(
    (property: { name: string }) =>
      property.name.endsWith("-radius") ||
      property.name.startsWith("--kit-radius-"),
  );
let server: OwnedServer | undefined;
let baseURL = "";
test.beforeAll(async () => {
  for (const [source, name] of [
    ["registry/styles/tokens.css", "tokens.css"],
    [
      "registry/contracts/component-customization-v1.json",
      "component-customization-v1.json",
    ],
  ]) {
    expect(
      readFileSync(
        `tests/fixtures/consumer/src/lib/qualification/tokens/${name}`,
      ),
      `Exact ${name} projection`,
    ).toEqual(readFileSync(source!));
  }
  const started = await startFixtureServer();
  server = started.server;
  baseURL = started.baseURL;
});
test.afterAll(async () => {
  if (server) {
    await server.stop();
    const failure = server.failure();
    if (failure) throw failure;
  }
});
test.beforeEach(async ({ page }) => {
  await page.goto(baseURL + "qualification/tokens");
  await expect(page.locator("main")).toHaveAttribute("data-hydrated", "true");
});

async function radius(page: Page, name: string) {
  return page
    .locator(`[data-property="${name}"]`)
    .evaluate((element) => getComputedStyle(element).borderRadius);
}
async function rootProperty(page: Page, name: string, value: string | null) {
  await page.evaluate(
    ({ name, value }) => {
      if (value === null) document.documentElement.style.removeProperty(name);
      else document.documentElement.style.setProperty(name, value);
    },
    { name, value },
  );
}
test("all mapped radius fallback expressions use their actual reference defaults", async ({
  page,
}) => {
  expect(properties).toHaveLength(30);
  for (const property of properties) {
    const reference = property.fallback.includes("calc(")
      ? "4px"
      : property.fallback.includes("--kit-radius-full")
        ? "999px"
        : property.fallback.includes("--kit-radius-lg")
          ? "8px"
          : property.fallback.includes("--kit-radius-sm")
            ? "4px"
            : "6px";
    expect(await radius(page, property.name), property.name).toBe(reference);
  }
});

test("every mapped semantic and component chain respects each fallback priority", async ({
  page,
}) => {
  for (const property of properties) {
    const levels = [
      ...new Set(
        [...property.fallback.matchAll(/var\((--kit-[a-z-]+)/g)].map(
          (match) => match[1]!,
        ),
      ),
    ].filter((name) => !/^--kit-radius-(sm|md|lg|full)$/.test(name));
    let value = 20;
    for (const name of [...levels].reverse()) {
      await rootProperty(page, name, `${value}px`);
      expect(
        await radius(page, property.name),
        `${property.name} through ${name}`,
      ).toBe(`${value}px`);
      value += 2;
    }
    await rootProperty(page, property.name, "14px");
    expect(await radius(page, property.name), property.name).toBe("14px");
    await rootProperty(page, property.name, null);
    for (const name of levels) await rootProperty(page, name, null);
  }
});
test("component then semantic then default then reference precedence is preserved", async ({
  page,
}) => {
  const name = "--kit-button-radius";
  expect(await radius(page, name)).toBe("6px");
  await rootProperty(page, "--kit-radius-default", "10px");
  expect(await radius(page, name)).toBe("10px");
  await rootProperty(page, "--kit-radius-control", "12px");
  expect(await radius(page, name)).toBe("12px");
  await rootProperty(page, name, "14px");
  expect(await radius(page, name)).toBe("14px");
  await rootProperty(page, name, null);
  expect(await radius(page, name)).toBe("12px");
  await rootProperty(page, "--kit-radius-control", null);
  expect(await radius(page, name)).toBe("10px");
  await rootProperty(page, "--kit-radius-default", null);
  expect(await radius(page, name)).toBe("6px");
});
test("all properties preserve multi-corner and elliptical border-radius grammar", async ({
  page,
}) => {
  for (const property of properties) {
    await rootProperty(
      page,
      property.name,
      "1px 2px 3px 4px / 5px 6px 7px 8px",
    );
    const corners = await page
      .locator(`[data-property="${property.name}"]`)
      .evaluate((element) => {
        const css = getComputedStyle(element);
        return [
          css.borderTopLeftRadius,
          css.borderTopRightRadius,
          css.borderBottomRightRadius,
          css.borderBottomLeftRadius,
        ];
      });
    expect(corners, property.name).toEqual([
      "1px 5px",
      "2px 6px",
      "3px 7px",
      "4px 8px",
    ]);
    await rootProperty(page, property.name, "10% 20% / 30% 40%");
    const percentage = await page
      .locator(`[data-property="${property.name}"]`)
      .evaluate((element) => getComputedStyle(element).borderTopLeftRadius);
    expect(percentage, property.name).toBe("10% 30%");
    await rootProperty(page, property.name, null);
  }
});
test("native invalid computed values and unset property behavior are explicit", async ({
  page,
}) => {
  await rootProperty(page, "--kit-button-radius", "not-a-radius");
  expect(await radius(page, "--kit-button-radius")).toBe("0px");
  await rootProperty(page, "--kit-button-radius", "initial");
  expect(await radius(page, "--kit-button-radius")).toBe("6px");
  await rootProperty(page, "--kit-button-radius", "unset");
  expect(await radius(page, "--kit-button-radius")).toBe("6px");
  await rootProperty(page, "--kit-button-radius", "calc(2px + 3px)");
  expect(await radius(page, "--kit-button-radius")).toBe("5px");
});
test("geometry-critical shapes ignore broad overrides but accept their exact property", async ({
  page,
}) => {
  for (const semantic of [
    "--kit-radius-default",
    "--kit-radius-control",
    "--kit-radius-surface",
    "--kit-radius-overlay",
    "--kit-radius-indicator",
  ])
    await rootProperty(page, semantic, "2px");
  for (const name of [
    "--kit-avatar-radius",
    "--kit-radio-radius",
    "--kit-spinner-radius",
    "--kit-switch-thumb-radius",
  ]) {
    expect(await radius(page, name), name).toBe("999px");
    await rootProperty(page, name, "3px 4px");
    expect(await radius(page, name)).toBe("3px 4px");
    await rootProperty(page, name, null);
  }
  expect(await radius(page, "--kit-button-radius")).toBe("2px");
});
test("document and custom-host placement follow CSS theme inheritance", async ({
  page,
}) => {
  await expect(page.locator("#document-probe")).toHaveCSS(
    "color",
    "rgb(17, 24, 39)",
  );
  await expect(page.locator("#inherited-probe")).toHaveCSS(
    "color",
    "rgb(255, 0, 0)",
  );
  const colors = await page.evaluate(() => {
    const original = document.getElementById("inherited-probe")!;
    const body = original.cloneNode(true) as HTMLElement;
    body.removeAttribute("id");
    document.body.append(body);
    const host = original.cloneNode(true) as HTMLElement;
    host.removeAttribute("id");
    document.getElementById("custom-theme")!.append(host);
    const result = [getComputedStyle(body).color, getComputedStyle(host).color];
    body.remove();
    host.remove();
    return result;
  });
  expect(colors).toEqual(["rgb(17, 24, 39)", "rgb(255, 0, 0)"]);
  await rootProperty(page, "--kit-color-text", "#0000ff");
  await expect(page.locator("#document-probe")).toHaveCSS(
    "color",
    "rgb(0, 0, 255)",
  );
  await expect(page.locator("#inherited-probe")).toHaveCSS(
    "color",
    "rgb(255, 0, 0)",
  );
});
test("baseline contrast observations retain actual computed colors without blanket certification", async ({
  page,
  browser,
}, info) => {
  const colors = await page.locator("[data-contrast]").evaluateAll((elements) =>
    elements.map((element) => {
      const css = getComputedStyle(element);
      return {
        pair: (element as HTMLElement).dataset["contrast"]!,
        foreground: css.color,
        background: css.backgroundColor,
      };
    }),
  );
  const luminance = (rgb: string) => {
    const channels = rgb
      .match(/\d+/g)!
      .map(Number)
      .slice(0, 3)
      .map((value) => {
        const channel = value / 255;
        return channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4;
      });
    return (
      channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722
    );
  };
  const observations = colors.map((pair) => {
    const a = luminance(pair.foreground),
      b = luminance(pair.background);
    return {
      ...pair,
      ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
    };
  });
  expect(observations).toHaveLength(6);
  for (const observation of observations) {
    expect(observation.ratio).toBeGreaterThanOrEqual(1);
    expect(observation.ratio).toBeLessThanOrEqual(21);
  }
  expect(
    observations.find((pair) => pair.pair === "text/canvas")!.foreground,
  ).toBe("rgb(17, 24, 39)");
  const evidence = info.outputPath("baseline-contrast.json");
  writeFileSync(
    evidence,
    JSON.stringify(
      {
        browser: browser.browserType().name(),
        browserVersion: browser.version(),
        project: info.project.name,
        observations,
        claim:
          "Measured default pairs only; application states and other components require their own qualification.",
      },
      null,
      2,
    ),
  );
  await info.attach("baseline-contrast.json", {
    path: evidence,
    contentType: "application/json",
  });
});
