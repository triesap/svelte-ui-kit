import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_STYLES_DIR,
  DEFAULT_UI_DIR,
  deriveKitPaths,
  parseKitConfig,
} from "../../src/project/config.js";
import { pathsOverlap } from "../../src/project/paths.js";

/**
 * S034 tests: UI/state/style/export roots cannot overlap, collide as
 * file/directory roles or alias the reserved coordination directory, while
 * prefix siblings stay valid. Overlap is deterministic and ASCII case folded,
 * so a would-be case-insensitive collision is caught on a case-sensitive
 * machine. These checks run before any planning.
 */

function code(value: Record<string, unknown>): string | undefined {
  const result = parseKitConfig(value);
  if (result.ok) return undefined;
  return result.issues[0]?.code;
}

test("stylesheet, config and export targets must stay distinct", () => {
  const derived = deriveKitPaths({
    schemaVersion: 1,
    toolVersion: "0.1.0",
    registry: "builtin",
    uiDir: DEFAULT_UI_DIR,
    stylesDir: DEFAULT_STYLES_DIR,
    layoutFile: "src/routes/+layout.svelte",
    requested: [],
  });
  assert.equal(
    code({ schemaVersion: 1, layoutFile: derived.kitCss }),
    "PATH_OVERLAP",
  );
  assert.equal(
    code({ schemaVersion: 1, layoutFile: derived.themesCss }),
    "PATH_OVERLAP",
  );
  assert.equal(
    code({ schemaVersion: 1, layoutFile: derived.rootExports }),
    "PATH_OVERLAP",
  );
  assert.equal(
    code({ schemaVersion: 1, stylesDir: derived.rootExports }),
    "PATH_OVERLAP",
  );
});

test("file roles may not equal or contain a directory root", () => {
  assert.equal(
    code({ schemaVersion: 1, layoutFile: "src/lib" }),
    "PATH_OVERLAP",
  );
  assert.equal(
    code({ schemaVersion: 1, stylesDir: `${DEFAULT_UI_DIR}/index.ts` }),
    "PATH_OVERLAP",
  );
  assert.equal(
    code({ schemaVersion: 1, stylesDir: `${DEFAULT_UI_DIR}` }),
    "PATH_OVERLAP",
  );
});

test("reserved state directory collisions fail across casing variants", () => {
  for (const state of [
    `${DEFAULT_UI_DIR}/_kit`,
    `${DEFAULT_UI_DIR}/_KIT`,
    `${DEFAULT_UI_DIR}/_Kit`,
  ]) {
    assert.equal(
      code({ schemaVersion: 1, uiDir: DEFAULT_UI_DIR, stylesDir: state }),
      "PATH_OVERLAP",
      `stylesDir=${state}`,
    );
    assert.equal(
      code({
        schemaVersion: 1,
        uiDir: DEFAULT_UI_DIR,
        layoutFile: `${state}/kit.lock.json`,
      }),
      "PATH_OVERLAP",
      `layoutFile=${state}`,
    );
  }
});

test("prefix siblings are not incorrectly rejected", () => {
  const okValues = [
    {
      schemaVersion: 1,
      uiDir: "src/lib/components/ui",
      stylesDir: "src/lib/components/ui-kit",
    },
    { schemaVersion: 1, uiDir: "app/ui", stylesDir: "app/ui-extra" },
    {
      schemaVersion: 1,
      uiDir: "src/lib/components/ui",
      stylesDir: "src/lib/components/ui/styles",
    },
  ];
  for (const value of okValues) {
    const result = parseKitConfig(value);
    assert.equal(result.ok, true, JSON.stringify(value));
  }
  assert.equal(pathsOverlap("a/kit", "a/kit-extra"), false);
  assert.equal(pathsOverlap("a/kit", "a/kit"), true);
});

test("case-aliased sibling roots collide deterministically", () => {
  assert.equal(
    code({ schemaVersion: 1, uiDir: "src/UI", stylesDir: "src/ui" }),
    "PATH_OVERLAP",
  );
  assert.equal(
    code({ schemaVersion: 1, uiDir: "src/Ui", stylesDir: "src/uI" }),
    "PATH_OVERLAP",
  );
});
