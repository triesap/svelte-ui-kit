import assert from "node:assert/strict";
import { test } from "node:test";

import {
  parseComponentCustomization,
  parseThemeMetadata,
  parseTokenContract,
  RUST_IDENTITY_PATTERN,
} from "../../src/registry/theme.js";

/**
 * S021 tests: token/property roles and the full radius-grammar declaration
 * validate; inconsistent contract ids/layers and Rust/Leptos ABI claims fail.
 */

const LAYERS = [
  "svelte-ui-kit.tokens",
  "svelte-ui-kit.themes",
  "svelte-ui-kit.components",
];

function tokenContract(overrides: Record<string, unknown> = {}) {
  return {
    id: "urn:svelte-ui-kit:token-contract:v1",
    contractVersion: 1,
    description: "Semantic design tokens.",
    layers: [...LAYERS],
    tokens: [
      {
        name: "--kit-radius-default",
        role: "radius",
        type: "length",
        fallback: "0.5rem",
      },
      {
        name: "--kit-surface",
        role: "surface",
        type: "color",
        fallback: "#ffffff",
      },
    ],
    radiusGrammar: { corners: 4, elliptical: true, slashSeparator: true },
    ...overrides,
  };
}

function componentCustomization(overrides: Record<string, unknown> = {}) {
  return {
    id: "urn:svelte-ui-kit:component-customization:v1",
    contractVersion: 1,
    description: "Runtime component properties.",
    properties: [
      {
        name: "--kit-button-radius",
        scope: "button",
        grammar: "<length>{1,4} [ / <length>{1,4} ]?",
        fallback: "var(--kit-radius-control)",
      },
    ],
    ...overrides,
  };
}

function themeIntegration(overrides: Record<string, unknown> = {}) {
  return {
    id: "urn:svelte-ui-kit:theme-integration:v1",
    contractVersion: 1,
    description: "Kit stylesheet integration.",
    stylesheet: "kit.css",
    layers: [...LAYERS],
    producer: "svelte-ui-kit",
    compatibility: { svelte: "^5.57.1", bits: "^2.19.3", date: "^3.8.1" },
    portal: { supported: true, strategies: ["document", "custom-host"] },
    tokenContract: {
      id: "urn:svelte-ui-kit:token-contract:v1",
      contractVersion: 1,
    },
    ...overrides,
  };
}

test("complete token, customization and theme metadata validates", () => {
  const result = parseThemeMetadata({
    tokenContract: tokenContract(),
    componentCustomization: componentCustomization(),
    themeIntegration: themeIntegration(),
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.equal(result.value.tokenContract.radiusGrammar.corners, 4);
    assert.equal(
      result.value.componentCustomization.properties[0]?.name,
      "--kit-button-radius",
    );
    assert.deepEqual(result.value.themeIntegration.portal.strategies, [
      "document",
      "custom-host",
    ]);
  }
});

test("the full border-radius grammar declaration is required", () => {
  for (const radiusGrammar of [
    { corners: 2, elliptical: true, slashSeparator: true },
    { corners: 4, elliptical: false, slashSeparator: true },
    { corners: 4, elliptical: true, slashSeparator: false },
  ]) {
    const result = parseTokenContract(tokenContract({ radiusGrammar }));
    assert.equal(result.ok, false, JSON.stringify(radiusGrammar));
  }
});

test("unknown token roles and malformed property names fail", () => {
  assert.equal(
    parseTokenContract(
      tokenContract({
        tokens: [
          { name: "--kit-x", role: "size", type: "length", fallback: "1rem" },
        ],
      }),
    ).ok,
    false,
  );
  assert.equal(
    parseComponentCustomization(
      componentCustomization({
        properties: [
          {
            name: "--button-radius",
            scope: "button",
            grammar: "1rem",
            fallback: "1rem",
          },
        ],
      }),
    ).ok,
    false,
  );
  assert.equal(
    parseComponentCustomization(
      componentCustomization({
        properties: [
          {
            name: "--kit-button-radius",
            scope: "button",
            grammar: "1rem",
            fallback: "1rem",
          },
          {
            name: "--kit-button-radius",
            scope: "button",
            grammar: "2rem",
            fallback: "2rem",
          },
        ],
      }),
    ).ok,
    false,
  );
});

test("inconsistent theme contract ids and layers fail", () => {
  const mismatchId = parseThemeMetadata({
    tokenContract: tokenContract(),
    componentCustomization: componentCustomization(),
    themeIntegration: themeIntegration({
      tokenContract: {
        id: "urn:someone-else:token-contract:v1",
        contractVersion: 1,
      },
    }),
  });
  assert.equal(mismatchId.ok, false);
  if (!mismatchId.ok) {
    assert.equal(mismatchId.issues[0]?.code, "THEME_CONTRACT_MISMATCH");
  }

  const mismatchLayers = parseThemeMetadata({
    tokenContract: tokenContract(),
    componentCustomization: componentCustomization(),
    themeIntegration: themeIntegration({
      layers: ["svelte-ui-kit.tokens"],
    }),
  });
  assert.equal(mismatchLayers.ok, false);
  if (!mismatchLayers.ok) {
    assert.equal(mismatchLayers.issues[0]?.code, "THEME_LAYERS_MISMATCH");
  }
});

test("Rust and Leptos identity claims are rejected", () => {
  for (const description of [
    "leptos_ui_kit token contract",
    "web_ui_primitives ABI",
    "compiled with wasm-bindgen",
  ]) {
    const result = parseTokenContract(tokenContract({ description }));
    assert.equal(result.ok, false, description);
    if (!result.ok) {
      assert.equal(result.issues[0]?.code, "RUST_IDENTITY_REJECTED");
    }
  }
  assert.equal(RUST_IDENTITY_PATTERN.test("svelte-ui-kit"), false);
  assert.equal(RUST_IDENTITY_PATTERN.test("trust"), false);
});
