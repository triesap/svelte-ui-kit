import assert from "node:assert/strict";
import { test } from "node:test";

import {
  adoptBaseOnClean,
  filesOwnedBy,
  isLockOwnerId,
  isSafeLockPath,
  ownerIndex,
  parseKitLock,
  preserveBaseOnCustomized,
  type LockFileRecord,
} from "../../src/codegen/lock.js";

/**
 * S019 tests: source ownership round-trips, duplicate ownership and
 * inconsistent indexes fail, and a preserved base never becomes current local
 * content.
 */

const H = (char: string) => char.repeat(64);

function base(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    schemaVersion: 1,
    toolVersion: "0.1.0",
    registryVersion: "0.1.0",
    registryHash: H("a"),
    configHash: H("b"),
    requested: ["button"],
    items: [
      { id: "button", version: "0.1.0", digest: H("c"), origin: "explicit" },
      { id: "spinner", version: "0.1.0", digest: H("d"), origin: "transitive" },
    ],
    files: [
      {
        path: "src/lib/components/ui/button.svelte",
        owner: "button",
        baseHash: H("e"),
        itemVersion: "0.1.0",
        cohort: "core",
      },
      {
        path: "src/lib/components/ui/spinner.svelte",
        owner: "spinner",
        baseHash: H("f"),
        itemVersion: "0.1.0",
        cohort: "core",
      },
    ],
    cssBlocks: [],
    integrations: [],
    ...overrides,
  };
}

function codesFor(value: unknown): string[] {
  const result = parseKitLock(value);
  assert.equal(result.ok, false, "expected the lock to fail");
  return result.ok ? [] : result.issues.map((entry) => entry.code);
}

test("valid source ownership round-trips", () => {
  const result = parseKitLock(base());
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    const index = ownerIndex(result.value);
    assert.equal(index.get("src/lib/components/ui/button.svelte"), "button");
    assert.equal(index.size, 2);
    assert.deepEqual(
      filesOwnedBy(result.value, "button").map((file) => file.path),
      ["src/lib/components/ui/button.svelte"],
    );
    assert.deepEqual(result.value.requested, ["button"]);
  }
});

test("duplicate ownership and unknown owners fail", () => {
  assert.equal(
    codesFor(
      base({
        files: [
          {
            path: "src/lib/components/ui/button.svelte",
            owner: "button",
            baseHash: H("e"),
            itemVersion: "0.1.0",
            cohort: "core",
          },
          {
            path: "src/lib/components/ui/button.svelte",
            owner: "spinner",
            baseHash: H("f"),
            itemVersion: "0.1.0",
            cohort: "core",
          },
        ],
      }),
    ).includes("LOCK_DUPLICATE_OWNERSHIP"),
    true,
  );
  assert.equal(
    codesFor(
      base({
        files: [
          {
            path: "src/lib/components/ui/button.svelte",
            owner: "ghost",
            baseHash: H("e"),
            itemVersion: "0.1.0",
            cohort: "core",
          },
        ],
      }),
    ).includes("LOCK_OWNER_UNKNOWN"),
    true,
  );
});

test("a stored reverse index is rejected", () => {
  assert.equal(
    codesFor(
      base({ owners: { "src/lib/components/ui/button.svelte": "button" } }),
    ).includes("SCHEMA_INVALID"),
    true,
  );
});

test("malformed hashes, versions and paths fail", () => {
  assert.equal(
    codesFor(
      base({
        files: [
          {
            path: "src/lib/components/ui/button.svelte",
            owner: "button",
            baseHash: "zz",
            itemVersion: "0.1.0",
            cohort: "core",
          },
        ],
      }),
    ).includes("SCHEMA_INVALID"),
    true,
  );
  assert.equal(
    codesFor(
      base({
        files: [
          {
            path: "../button.svelte",
            owner: "button",
            baseHash: H("e"),
            itemVersion: "nope",
            cohort: "core",
          },
        ],
      }),
    ).some(
      (code) =>
        code === "LOCK_PATH_INVALID" || code === "LOCK_ITEM_VERSION_INVALID",
    ),
    true,
  );
});

test("requested roots must equal explicit items", () => {
  assert.equal(
    codesFor(
      base({
        requested: ["button"],
        items: [
          {
            id: "button",
            version: "0.1.0",
            digest: H("c"),
            origin: "transitive",
          },
        ],
      }),
    ).includes("LOCK_ORIGIN_MISMATCH"),
    true,
  );
});

test("a preserved base cannot silently become current local content", () => {
  const result = parseKitLock(base());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const record = result.value.files[0] as LockFileRecord;

  const preserved = preserveBaseOnCustomized(record);
  assert.equal(preserved.baseHash, record.baseHash);
  assert.equal(preserved.itemVersion, record.itemVersion);

  const advanced = adoptBaseOnClean(record, {
    version: "0.2.0",
    hash: H("9"),
  });
  assert.equal(advanced.baseHash, H("9"));
  assert.equal(advanced.itemVersion, "0.2.0");
  // The original record is untouched.
  assert.equal(record.baseHash, H("e"));
});

test("safe lock paths and owner ids are recognized", () => {
  assert.equal(isSafeLockPath("src/lib/components/ui/button.svelte"), true);
  assert.equal(isSafeLockPath("../button.svelte"), false);
  assert.equal(isSafeLockPath("/button.svelte"), false);
  assert.equal(isLockOwnerId("alert-dialog"), true);
  assert.equal(isLockOwnerId("Alert"), false);
});

test("release identities must be strict SemVer at the parse boundary", () => {
  assert.equal(
    codesFor(base({ toolVersion: "garbage" })).includes("SEMVER_INVALID"),
    true,
  );
  assert.equal(
    codesFor(base({ registryVersion: "1.2" })).includes("SEMVER_INVALID"),
    true,
  );
});

test("validated mapping context rejects reserved-state and out-of-namespace records", () => {
  const context = {
    stateDir: "src/lib/components/ui/_kit",
    uiDir: "src/lib/components/ui",
    stylesDir: "src/styles",
  };
  const reserved = parseKitLock(
    base({
      files: [
        {
          path: "src/lib/components/ui/_kit/kit.lock.json",
          owner: "button",
          baseHash: H("e"),
          itemVersion: "0.1.0",
          cohort: "core",
        },
      ],
    }),
    ".kit/kit.lock.json",
    context,
  );
  assert.equal(reserved.ok, false);
  if (!reserved.ok) {
    assert.equal(
      reserved.issues.some((entry) => entry.code === "LOCK_RESERVED_STATE"),
      true,
    );
  }

  const outside = parseKitLock(
    base({
      files: [
        {
          path: "elsewhere/button.svelte",
          owner: "button",
          baseHash: H("e"),
          itemVersion: "0.1.0",
          cohort: "core",
        },
      ],
    }),
    ".kit/kit.lock.json",
    context,
  );
  assert.equal(outside.ok, false);
  if (!outside.ok) {
    assert.equal(
      outside.issues.some((entry) => entry.code === "LOCK_NAMESPACE"),
      true,
    );
  }

  const good = parseKitLock(base(), ".kit/kit.lock.json", context);
  assert.equal(good.ok, true, JSON.stringify(good));
});

test("managed files cannot claim a namespace directory or reserve state ancestry", () => {
  const context = {
    stateDir: "src/lib/components/ui/_kit",
    uiDir: "src/lib/components/ui",
    stylesDir: "src/styles",
  };
  const fileRecord = (path: string): Record<string, unknown> => ({
    path,
    owner: "button",
    baseHash: H("e"),
    itemVersion: "0.1.0",
    cohort: "core",
  });

  for (const path of ["src/lib/components/ui", "SRC/LIB/COMPONENTS/UI"]) {
    const result = parseKitLock(
      base({ files: [fileRecord(path)] }),
      ".kit/kit.lock.json",
      context,
    );
    assert.equal(result.ok, false, path);
    if (!result.ok) {
      assert.equal(
        result.issues.some((entry) => entry.code === "LOCK_NAMESPACE"),
        true,
        path,
      );
    }
  }

  const stylesNamespace = parseKitLock(
    base({ files: [fileRecord("src/styles")] }),
    ".kit/kit.lock.json",
    context,
  );
  assert.equal(stylesNamespace.ok, false);
  if (!stylesNamespace.ok) {
    assert.equal(
      stylesNamespace.issues.some((entry) => entry.code === "LOCK_NAMESPACE"),
      true,
    );
  }

  const ancestor = parseKitLock(
    base({ files: [fileRecord("src/lib/components")] }),
    ".kit/kit.lock.json",
    context,
  );
  assert.equal(ancestor.ok, false);
  if (!ancestor.ok) {
    assert.equal(
      ancestor.issues.some((entry) => entry.code === "LOCK_RESERVED_STATE"),
      true,
    );
  }
});

/**
 * RCLD02-R3-2: the complete logical lock claim set is validated for ASCII case
 * aliases, file/directory role conflicts and integration namespace claims.
 */
test("ASCII case-alias lock records and file ancestors are rejected", () => {
  const fileRecord = (
    path: string,
    owner: string,
  ): Record<string, unknown> => ({
    path,
    owner,
    baseHash: H("e"),
    itemVersion: "0.1.0",
    cohort: "core",
  });

  const alias = parseKitLock(
    base({
      files: [
        fileRecord("src/lib/components/ui/button.svelte", "button"),
        fileRecord("src/lib/components/ui/Button.svelte", "spinner"),
      ],
    }),
  );
  assert.equal(alias.ok, false, JSON.stringify(alias));
  if (!alias.ok) {
    assert.equal(
      alias.issues.some((entry) => entry.code === "LOCK_CASE_ALIAS"),
      true,
    );
  }

  const ancestor = parseKitLock(
    base({
      files: [
        fileRecord("src/lib/components/ui/button.svelte", "button"),
        fileRecord(
          "src/lib/components/ui/button.svelte/card.svelte",
          "spinner",
        ),
      ],
    }),
  );
  assert.equal(ancestor.ok, false, JSON.stringify(ancestor));
  if (!ancestor.ok) {
    assert.equal(
      ancestor.issues.some((entry) => entry.code === "LOCK_PATH_OVERLAP"),
      true,
    );
  }
});

test("valid compound siblings and multiple blocks in one aggregate remain valid", () => {
  const good = parseKitLock(
    base({
      files: [
        {
          path: "src/lib/components/ui/button/root.svelte",
          owner: "button",
          baseHash: H("e"),
          itemVersion: "0.1.0",
          cohort: "core",
        },
        {
          path: "src/lib/components/ui/button/trigger.svelte",
          owner: "spinner",
          baseHash: H("f"),
          itemVersion: "0.1.0",
          cohort: "core",
        },
      ],
      cssBlocks: [
        {
          path: "src/styles/kit.css",
          owner: "button",
          blockId: "button",
          baseHash: H("1"),
          itemVersion: "0.1.0",
          cohort: "core",
        },
        {
          path: "src/styles/kit.css",
          owner: "spinner",
          blockId: "spinner",
          baseHash: H("2"),
          itemVersion: "0.1.0",
          cohort: "core",
        },
      ],
    }),
  );
  assert.equal(good.ok, true, JSON.stringify(good));
});

test("an integration path cannot claim a required namespace directory", () => {
  const context = {
    stateDir: "src/ui/_kit",
    uiDir: "src/ui",
    stylesDir: "src/ui/styles",
  };
  const integration = (path: string): Record<string, unknown> => ({
    kind: "layout",
    path,
    baseline: H("e"),
    contract: "layout-v1",
  });

  for (const path of ["src/ui/styles", "src/ui", "src/ui/_kit"]) {
    const result = parseKitLock(
      base({ files: [], integrations: [integration(path)] }),
      ".kit/kit.lock.json",
      context,
    );
    assert.equal(result.ok, false, path);
  }

  const valid = parseKitLock(
    base({
      files: [],
      integrations: [integration("src/routes/+layout.svelte")],
    }),
    ".kit/kit.lock.json",
    context,
  );
  assert.equal(valid.ok, true, JSON.stringify(valid));
});
