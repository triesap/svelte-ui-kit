import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseCss } from "svelte/compiler";
import {
  KIT_LAYERS,
  parseTokenContract,
  parseComponentCustomization,
  RUST_IDENTITY_PATTERN,
} from "../../src/registry/theme.js";

const semantic = JSON.parse(
  readFileSync("registry/contracts/theme-v1.json", "utf8"),
);
const customization = JSON.parse(
  readFileSync("registry/contracts/component-customization-v1.json", "utf8"),
);
const mapping = readFileSync("specs/component-maps/tokens.md", "utf8");
const baseline = readFileSync("references/TOKEN_BASELINE.md", "utf8");
const mappedRows = mapping
  .split("\n")
  .filter((line) => /^\| --kit-/.test(line))
  .map((line) =>
    line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim()),
  );

test("all twenty Button hooks match actual stylesheet declarations and documented source fallbacks", () => {
  const properties = customization.properties.filter(
    (entry: { scope: string }) => entry.scope === "button",
  );
  assert.equal(properties.length, 20);
  const values: string[] = [];
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (value === null || typeof value !== "object") return;
    const node = value as Record<string, unknown>;
    if (node["type"] === "Declaration" && typeof node["value"] === "string")
      values.push(node["value"].replace(/\s+/g, ""));
    for (const [key, child] of Object.entries(node))
      if (key !== "metadata") visit(child);
  };
  visit(parseCss(readFileSync("registry/styles/button.css", "utf8")).children);
  const documented = readFileSync("specs/component-maps/button.md", "utf8");
  for (const property of properties) {
    assert.ok(
      values.some((value) =>
        value.includes(
          `var(${property.name},${property.fallback})`.replace(/\s+/g, ""),
        ),
      ),
      property.name,
    );
    assert.ok(documented.includes(property.name), property.name);
    assert.ok(
      documented
        .replace(/\s+/g, "")
        .includes(property.fallback.replace(/\s+/g, "")),
      property.fallback,
    );
  }
});

test("source-supported Spinner hooks match actual compiler-parsed stylesheet fallbacks", () => {
  const properties = customization.properties.filter(
    (entry: { scope: string }) => entry.scope === "spinner",
  );
  assert.deepEqual(
    properties.map((entry: { name: string }) => entry.name).sort(),
    [
      "--kit-spinner-inline-size",
      "--kit-spinner-block-size",
      "--kit-spinner-border-width",
      "--kit-spinner-track-color",
      "--kit-spinner-color",
      "--kit-spinner-animation-duration",
      "--kit-spinner-radius",
    ].sort(),
  );
  const values: string[] = [];
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (value === null || typeof value !== "object") return;
    const node = value as Record<string, unknown>;
    if (node["type"] === "Declaration" && typeof node["value"] === "string")
      values.push(node["value"].replace(/\s+/g, ""));
    for (const [key, child] of Object.entries(node))
      if (key !== "metadata") visit(child);
  };
  visit(parseCss(readFileSync("registry/styles/spinner.css", "utf8")).children);
  for (const property of properties)
    assert.ok(
      values.some((value) =>
        value.includes(
          `var(${property.name},${property.fallback})`.replace(/\s+/g, ""),
        ),
      ),
      property.name,
    );
});

test("portable contracts validate independently without source ABI identities", () => {
  const tokens = parseTokenContract(semantic);
  const properties = parseComponentCustomization(customization);
  assert.equal(tokens.ok, true, JSON.stringify(tokens));
  assert.equal(properties.ok, true, JSON.stringify(properties));
  assert.deepEqual(semantic.layers, KIT_LAYERS);
  assert.equal(
    RUST_IDENTITY_PATTERN.test(JSON.stringify([semantic, customization])),
    false,
  );
  assert.notEqual(semantic.id, customization.id);
  assert.equal(semantic.contractVersion, 1);
  assert.equal(customization.contractVersion, 1);
});

test("all observed semantic defaults remain exact with explicit role and value type", () => {
  const rows = [
    ...baseline.matchAll(/^\|\s*(--kit-[a-z0-9-]+)\s*\|\s*([^|]+?)\s*\|/gm),
  ];
  assert.equal(rows.length, 44);
  assert.equal(semantic.tokens.length, 44);
  for (const row of rows) {
    const token = semantic.tokens.find(
      (entry: { name: string }) => entry.name === row[1],
    );
    assert.ok(token, row[1]);
    assert.equal(token.fallback, row[2]!.trim(), row[1]);
    assert.deepEqual(
      mappedRows.find((row) => row[0] === token.name),
      [token.name, token.role, token.type, token.fallback],
    );
  }
  for (const [name, role, type] of [
    ["--kit-color-text", "text", "color"],
    ["--kit-color-surface", "surface", "color"],
    ["--kit-color-border", "border", "color"],
    ["--kit-focus-ring", "focus", "color"],
    ["--kit-radius-full", "radius", "length"],
    ["--kit-duration-fast", "motion", "duration"],
    ["--kit-easing-standard", "easing", "string"],
    ["--kit-disabled-opacity", "opacity", "number"],
  ]) {
    const token = semantic.tokens.find(
      (entry: { name: string }) => entry.name === name,
    );
    assert.ok(token, name);
    assert.equal(token.role, role, name);
    assert.equal(token.type, type, name);
  }
});

test("complete source radius inventory retains roles, ordered fallbacks and exact circular overrides", () => {
  const names = [
    "radius-default",
    "radius-control",
    "radius-surface",
    "radius-overlay",
    "radius-indicator",
    "alert-radius",
    "avatar-radius",
    "badge-radius",
    "button-radius",
    "card-radius",
    "checkbox-radius",
    "collapsible-trigger-radius",
    "dialog-trigger-radius",
    "dialog-close-radius",
    "dialog-radius",
    "field-surface-radius",
    "field-control-radius",
    "input-radius",
    "select-radius",
    "textarea-radius",
    "menu-trigger-radius",
    "menu-content-radius",
    "menu-item-radius",
    "progress-radius",
    "radio-radius",
    "skeleton-radius",
    "spinner-radius",
    "switch-radius",
    "switch-thumb-radius",
    "tabs-trigger-radius",
  ].map((name) => `--kit-${name}`);
  assert.deepEqual(
    customization.properties
      .filter(
        (entry: { name: string }) =>
          entry.name.endsWith("-radius") ||
          entry.name.startsWith("--kit-radius-"),
      )
      .map((entry: { name: string }) => entry.name),
    names,
  );
  const property = (name: string) =>
    customization.properties.find(
      (entry: { name: string }) => entry.name === `--kit-${name}`,
    );
  assert.equal(
    property("button-radius").fallback,
    "var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))",
  );
  assert.equal(
    property("card-radius").fallback,
    "var(--kit-radius-surface, var(--kit-radius-default, var(--kit-radius-lg)))",
  );
  assert.equal(
    property("menu-item-radius").fallback,
    "var(--kit-radius-control, var(--kit-radius-default, calc(var(--kit-radius-md) - 2px)))",
  );
  for (const name of [
    "avatar-radius",
    "radio-radius",
    "spinner-radius",
    "switch-thumb-radius",
  ]) {
    assert.equal(property(name).fallback, "var(--kit-radius-full)");
    const row = mappedRows.find((row) => row[0] === `--kit-${name}`);
    assert.ok(row);
    assert.equal(row[2], "geometry-critical");
    assert.equal(row[3], "yes");
  }
  for (const p of customization.properties.filter((entry: { name: string }) =>
    names.includes(entry.name),
  )) {
    const row = mappedRows.find((row) => row[0] === p.name);
    assert.ok(row);
    assert.equal(row[1], p.scope);
    assert.equal(row[4], "`" + p.fallback + "`");
  }
});

test("complete radius syntax remains declared and accepted without typed registration", () => {
  assert.deepEqual(semantic.radiusGrammar, {
    corners: 4,
    elliptical: true,
    slashSeparator: true,
  });
  for (const property of customization.properties.filter(
    (entry: { name: string }) =>
      entry.name.endsWith("-radius") || entry.name.startsWith("--kit-radius-"),
  )) {
    assert.ok(property.grammar.includes("{1,4}"));
    assert.ok(property.grammar.includes(" / "));
    assert.ok(property.grammar.includes("revert-layer"));
  }
  for (const value of [
    "1px 2px 3px 4px / 5% 6% 7% 8%",
    "calc(1rem + 2px) / 25%",
    "var(--app-radius)",
    "revert-layer",
  ]) {
    assert.doesNotThrow(() => parseCss(`.sample { border-radius: ${value}; }`));
  }
  // This is parser/contract evidence; actual computed behavior is S095.
  assert.ok(
    readFileSync("LICENSE-MIT", "utf8").includes(
      "Copyright (c) 2026 Tyson Lupul",
    ),
  );
  assert.ok(mapping.includes("MIT OR Apache-2.0"));
});
