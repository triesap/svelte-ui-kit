import assert from "node:assert/strict";
import { cpSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { cliPackage, write } from "../helpers/cli-package.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import { computeRegistryContentHash } from "../../src/registry/model.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import {
  deriveKitPaths,
  DEFAULT_KIT_CONFIG,
} from "../../src/project/config.js";
import {
  parseThemeMetadata,
  tokenMetadataPaths,
} from "../../src/registry/theme.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";

const state = deriveKitPaths(DEFAULT_KIT_CONFIG).stateDir;
const paths = tokenMetadataPaths(state);
function json(root: string, file: string) {
  return JSON.parse(readFileSync(path.join(root, file), "utf8"));
}
function fixture() {
  const owned = cliPackage();
  rmSync(path.join(owned.pkg, "registry"), { recursive: true, force: true });
  cpSync("registry", path.join(owned.pkg, "registry"), { recursive: true });
  return owned;
}
function rehash(pkg: string) {
  const root = json(pkg, "registry/registry.json");
  const manifest = json(pkg, "registry/foundation/tokens.json");
  const assets = [
    "registry/foundation/tokens.json",
    "registry/styles/tokens.css",
    ...Object.values(manifest.contracts ?? {}).map(
      (value) => `registry/${value}`,
    ),
  ].map((file) => ({
    path: file,
    digest: sha256Hex(readFileSync(path.join(pkg, file))),
  }));
  write(
    pkg,
    "registry/registry.json",
    JSON.stringify({
      ...root,
      contentHash: computeRegistryContentHash(root, assets),
    }),
  );
}
function run(owned: ReturnType<typeof fixture>, args: string[], status = 0) {
  const result = owned.run(args);
  assert.equal(result.status, status, result.stdout + result.stderr);
  assert.equal(result.stderr, "");
  return JSON.parse(result.stdout);
}
function install(owned: ReturnType<typeof fixture>) {
  run(owned, ["init"]);
  run(owned, ["add", "tokens"]);
}

for (const unsafe of ["untracked", "symlink"] as const)
  test(`metadata ${unsafe} destination refuses the whole add`, () => {
    const owned = fixture();
    try {
      run(owned, ["init"]);
      if (unsafe === "untracked")
        write(owned.root, paths[0]!, "unowned user metadata");
      else
        symlinkSync(
          path.join(owned.root, "package.json"),
          path.join(owned.root, paths[0]!),
        );
      const before = snapshotTree(owned.root);
      run(owned, ["add", "tokens"], unsafe === "untracked" ? 10 : 11);
      assert.deepEqual(snapshotTree(owned.root), before);
    } finally {
      owned.cleanup();
    }
  });
function revision(pkg: string) {
  const manifest = json(pkg, "registry/foundation/tokens.json");
  manifest.version = "0.2.0";
  write(pkg, "registry/foundation/tokens.json", JSON.stringify(manifest));
  const contract = json(pkg, "registry/contracts/theme-v1.json");
  contract.tokens.find(
    (token: { name: string }) => token.name === "--kit-color-canvas",
  ).fallback = "#fafafa";
  write(pkg, "registry/contracts/theme-v1.json", JSON.stringify(contract));
  write(
    pkg,
    "registry/styles/tokens.css",
    readFileSync(path.join(pkg, "registry/styles/tokens.css"), "utf8").replace(
      "--kit-color-canvas: #f8fafc;",
      "--kit-color-canvas: #fafafa;",
    ),
  );
  rehash(pkg);
}
test("actual metadata independently parses, tracks exact bytes and shares CSS cohort through a v1 upgrade", () => {
  const owned = fixture();
  try {
    install(owned);
    const parsed = parseThemeMetadata({
      tokenContract: json(owned.root, paths[0]!),
      componentCustomization: json(owned.root, paths[1]!),
      themeIntegration: json(owned.root, paths[2]!),
    });
    assert.equal(parsed.ok, true, JSON.stringify(parsed));
    if (parsed.ok) {
      assert.equal(parsed.value.themeIntegration.stylesheet, "kit.css");
      assert.equal(parsed.value.themeIntegration.producer, "svelte-ui-kit");
      assert.equal(parsed.value.tokenContract.tokens.length, 44);
    }
    revision(owned.pkg);
    run(owned, ["sync"]);
    const lock = json(owned.root, `${state}/kit.lock.json`);
    assert.equal(lock.items[0].version, "0.2.0");
    assert.equal(lock.files.length, 3);
    for (const file of lock.files) {
      assert.equal(file.owner, "tokens");
      assert.equal(file.cohort, "tokens");
      assert.equal(
        file.baseHash,
        sha256Hex(readFileSync(path.join(owned.root, file.path))),
      );
      assert.equal(
        file.itemVersion,
        file.path === paths[0] ? "0.2.0" : "0.1.0",
      );
    }
    assert.equal(
      json(owned.root, paths[0]!).tokens.find(
        (token: { name: string }) => token.name === "--kit-color-canvas",
      ).fallback,
      "#fafafa",
    );
    const before = snapshotTree(owned.root);
    assert.equal(run(owned, ["sync"]).status, "no_change");
    assert.deepEqual(snapshotTree(owned.root), before);
  } finally {
    owned.cleanup();
  }
});
test("customized metadata keeps its old baseline and conflicts atomically with an upstream token upgrade", () => {
  const owned = fixture();
  try {
    install(owned);
    const lock = json(owned.root, `${state}/kit.lock.json`);
    const contract = json(owned.root, paths[0]!);
    contract.description += " locally customized";
    write(owned.root, paths[0]!, JSON.stringify(contract));
    run(owned, ["sync"]);
    assert.equal(
      json(owned.root, `${state}/kit.lock.json`).files.find(
        (file: { path: string }) => file.path === paths[0],
      ).baseHash,
      lock.files.find((file: { path: string }) => file.path === paths[0])
        .baseHash,
    );
    revision(owned.pkg);
    const before = snapshotTree(owned.root);
    run(owned, ["sync"], 10);
    assert.deepEqual(snapshotTree(owned.root), before);
  } finally {
    owned.cleanup();
  }
});
for (const failure of [
  "future",
  "mismatch",
  "comment-proof",
  "override",
  "removed",
] as const)
  test(`actual contract ${failure} refuses without any consumer mutation`, () => {
    const owned = fixture();
    try {
      install(owned);
      if (failure === "removed") {
        const manifest = json(owned.pkg, "registry/foundation/tokens.json");
        delete manifest.contracts;
        write(
          owned.pkg,
          "registry/foundation/tokens.json",
          JSON.stringify(manifest),
        );
      } else if (failure === "comment-proof")
        write(
          owned.pkg,
          "registry/styles/tokens.css",
          readFileSync(
            path.join(owned.pkg, "registry/styles/tokens.css"),
            "utf8",
          ).replace(
            "--kit-color-canvas: #f8fafc;",
            "/* --kit-color-canvas: #f8fafc; */",
          ),
        );
      else if (failure === "override")
        write(
          owned.pkg,
          "registry/styles/tokens.css",
          readFileSync(
            path.join(owned.pkg, "registry/styles/tokens.css"),
            "utf8",
          ).replace(
            "/* svelte-ui-kit:end tokens */",
            ":root { --kit-color-canvas: #abcdef; }\n/* svelte-ui-kit:end tokens */",
          ),
        );
      else {
        const contract = json(owned.pkg, "registry/contracts/theme-v1.json");
        if (failure === "future") contract.contractVersion = 2;
        else contract.tokens[0].fallback = "#abcdef";
        write(
          owned.pkg,
          "registry/contracts/theme-v1.json",
          JSON.stringify(contract),
        );
      }
      rehash(owned.pkg);
      const before = snapshotTree(owned.root);
      run(owned, ["sync"], failure === "removed" ? 10 : 12);
      assert.deepEqual(snapshotTree(owned.root), before);
    } finally {
      owned.cleanup();
    }
  });
test("original loaded contract authority cannot be changed by provider edits or nested mutation", () => {
  const owned = fixture();
  try {
    const loaded = loadRegistrySnapshot(createAssetProvider(owned.pkg));
    assert.equal(loaded.ok, true, JSON.stringify(loaded));
    if (!loaded.ok) return;
    const original = loaded.value.items[0]!.contracts!;
    const before = JSON.stringify(original);
    revision(owned.pkg);
    assert.equal(JSON.stringify(original), before);
    assert.throws(
      () =>
        Object.assign(original.tokenContract.tokens[0]!, {
          fallback: "forged",
        }),
      TypeError,
    );
    assert.ok(
      loaded.value.assets.some(
        (asset) => asset.path === "registry/contracts/theme-v1.json",
      ),
    );
  } finally {
    owned.cleanup();
  }
});
test("doctor detects invalid or missing metadata read-only; clean retirement and re-add preserve truthful ownership", () => {
  const owned = fixture();
  try {
    install(owned);
    const original = readFileSync(path.join(owned.root, paths[0]!));
    revision(owned.pkg);
    write(owned.root, paths[0]!, "{}");
    const before = snapshotTree(owned.root);
    const result = owned.run(["doctor", "--strict"]);
    assert.notEqual(result.status, 0, result.stdout);
    assert.ok(
      JSON.parse(result.stdout).data.checks.some(
        (check: { code: string }) =>
          check.code.startsWith("SCHEMA_") || check.code.startsWith("TOKEN_"),
      ),
      result.stdout,
    );
    assert.deepEqual(snapshotTree(owned.root), before);
    write(owned.root, paths[0]!, original.toString());
    rmSync(path.join(owned.root, paths[0]!));
    const missing = snapshotTree(owned.root);
    const missingResult = owned.run(["doctor", "--strict"]);
    assert.notEqual(missingResult.status, 0);
    assert.ok(
      JSON.parse(missingResult.stdout).data.checks.some(
        (check: { code: string }) => check.code === "DOCTOR_TARGET_MISSING",
      ),
    );
    assert.deepEqual(snapshotTree(owned.root), missing);
    write(owned.root, paths[0]!, original.toString());
    const config = json(owned.root, `${state}/kit.json`);
    config.requested = [];
    write(owned.root, `${state}/kit.json`, JSON.stringify(config));
    run(owned, ["sync"]);
    assert.equal(json(owned.root, `${state}/kit.lock.json`).files.length, 0);
    for (const file of paths)
      assert.throws(() => readFileSync(path.join(owned.root, file)));
    run(owned, ["add", "tokens"]);
    assert.equal(json(owned.root, `${state}/kit.lock.json`).files.length, 3);
  } finally {
    owned.cleanup();
  }
});
