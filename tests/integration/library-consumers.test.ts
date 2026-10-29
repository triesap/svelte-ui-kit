/** Real packed library and independent native consumers; source metadata is never runtime proof. */
import assert from "node:assert/strict";
import { test } from "node:test";
import path from "node:path";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { parse, stringify } from "yaml";
import {
  installIndependentCli,
  runtimeGuard,
} from "../helpers/packaged-cli.js";
import {
  nativeCommand,
  verifyTargetConsumer,
} from "../helpers/target-consumer.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import { NATIVE_BASELINE } from "../../src/project/native-dependency.js";
import { sha256Hex } from "../../src/codegen/digest.js";
const owner = realpathSync(process.cwd());
const libraryName = "@example/generated-ui-library";
const workspace = parse(
  readFileSync(path.join(owner, "pnpm-workspace.yaml"), "utf8"),
);
function clone(blueprint: string, root: string) {
  mkdirSync(root, { recursive: true });
  cpSync(path.join(owner, blueprint), root, {
    recursive: true,
    filter: (source) =>
      !source
        .split(path.sep)
        .some((p) =>
          [
            "node_modules",
            ".astro",
            ".svelte-kit",
            "dist",
            "build",
            ".native-build",
          ].includes(p),
        ),
  });
  writeFileSync(
    path.join(root, "pnpm-workspace.yaml"),
    stringify({
      packages: ["."],
      catalog: workspace.catalog,
      minimumReleaseAgeExclude: workspace.minimumReleaseAgeExclude,
    }),
  );
}
function nativeArchive(root: string, packageRoot: string) {
  const manifest = JSON.parse(
    readFileSync(path.join(root, "package.json"), "utf8"),
  );
  const locator =
    manifest.dependencies?.["bits-ui"] ?? manifest.devDependencies?.["bits-ui"];
  assert.ok(typeof locator === "string" && locator.startsWith("file:./"));
  const bytes = readFileSync(
    path.join(packageRoot, "dist/native", NATIVE_BASELINE.archive),
  );
  assert.equal(sha256Hex(bytes), NATIVE_BASELINE.archiveSha256);
  const destination = path.join(root, locator.slice(7));
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, bytes);
}
function setup(root: string, logs: Record<string, string>) {
  logs.install = nativeCommand(root, "pnpm", [
    "install",
    "--ignore-scripts",
    "--strict-peer-dependencies",
    "--engine-strict",
  ]);
  logs.frozenInstall = nativeCommand(root, "pnpm", [
    "install",
    "--frozen-lockfile",
    "--offline",
    "--ignore-scripts",
    "--strict-peer-dependencies",
    "--engine-strict",
  ]);
}
function cliResult(
  cli: ReturnType<typeof installIndependentCli>,
  root: string,
  args: string[],
) {
  const result = cli.run(args, root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(result.guardEvents, []);
  return result.stdout;
}
function sourceGuard(root: string) {
  const audit = path.join(root, "source-audit.jsonl"),
    guard = path.join(root, "source-guard.cjs");
  writeFileSync(audit, "");
  writeFileSync(guard, runtimeGuard(owner, audit, root, true));
  const env = {
    NODE_OPTIONS: `--require ${JSON.stringify(guard)}`,
    ASTRO_TELEMETRY_DISABLED: "1",
  };
  const link = path.join(root, "authoring-source-link"),
    actual = path.join(owner, "package.json");
  symlinkSync(actual, link);
  const controls: unknown[] = [];
  for (const [kind, script] of [
    ["read", `require('node:fs').readFileSync(${JSON.stringify(actual)})`],
    ["symlink", `require('node:fs').readFileSync(${JSON.stringify(link)})`],
    [
      "directory-list",
      `require('node:fs').readdirSync(${JSON.stringify(owner)})`,
    ],
    [
      "module",
      `await import(${JSON.stringify(path.join(owner, "dist/project/config.js"))})`,
    ],
  ] as const) {
    const code = `try { ${script}; throw Error('source denial control did not reject'); } catch(e) { if(e.code!=='OWNED_AUTHORING_UNAVAILABLE') throw e; console.log(e.code); }`;
    const output = nativeCommand(
      root,
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        kind === "module"
          ? code
          : `const require=(await import('node:module')).createRequire(import.meta.url);${code}`,
      ],
      env,
    );
    assert.match(output, /OWNED_AUTHORING_UNAVAILABLE/);
    const events = readFileSync(audit, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    assert.equal(events.length, 1);
    controls.push({ kind, output, events });
    writeFileSync(audit, "");
  }
  // pnpm12 is native; prove its real Node children inherit the guard.
  const inheritedControls: unknown[] = [];
  for (const [kind, code, script] of [
    [
      "source",
      "OWNED_AUTHORING_UNAVAILABLE",
      `const require=(await import('node:module')).createRequire(import.meta.url);require('node:fs').readFileSync(${JSON.stringify(actual)})`,
    ],
    [
      "network",
      "OWNED_NETWORK_DISABLED",
      `await fetch('https://example.invalid/owned-guard-control')`,
    ],
  ] as const) {
    const program = `try{${script};throw Error('inherited guard did not reject')}catch(e){if(e.code!==${JSON.stringify(code)})throw e;console.log(e.code)}`;
    const output = nativeCommand(
      root,
      "pnpm",
      ["exec", process.execPath, "--input-type=module", "--eval", program],
      env,
    );
    assert.ok(output.includes(code));
    const events = readFileSync(audit, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    assert.equal(events.filter((event) => event.code === code).length, 1);
    for (const event of events)
      if (event.code !== code) {
        assert.equal(event.kind, "unavailable-metadata");
        assert.equal(event.code, "ENOENT");
      }
    inheritedControls.push({ kind, code, output, events });
    writeFileSync(audit, "");
  }
  writeFileSync(
    path.join(root, "pnpm-guard-controls.json"),
    JSON.stringify(inheritedControls, null, 2),
  );
  const absentControls: unknown[] = [];
  const file = JSON.stringify(actual);
  for (const [kind, script] of [
    [
      "sync",
      `try{fs.statSync(${file});throw Error('existing source was visible')}catch(e){assert.equal(e.code,'ENOENT')}`,
    ],
    [
      "callback",
      `let returned=false;await new Promise((resolve,reject)=>{fs.stat(${file},e=>{try{assert.equal(returned,true);assert.equal(e.code,'ENOENT');resolve()}catch(failure){reject(failure)}});returned=true})`,
    ],
    [
      "promise",
      `await assert.rejects(fs.promises.stat(${file}),{code:'ENOENT'})`,
    ],
    ["existsSync", `assert.equal(fs.existsSync(${file}),false)`],
    [
      "exists",
      `assert.equal(await new Promise(resolve=>fs.exists(${file},resolve)),false)`,
    ],
    [
      "throwIfNoEntry",
      `assert.equal(fs.lstatSync(${file},{throwIfNoEntry:false}),undefined)`,
    ],
  ] as const) {
    const code = `const require=(await import('node:module')).createRequire(import.meta.url);const fs=require('node:fs'),assert=require('node:assert/strict');${script};console.log('source metadata unavailable')`;
    const output = nativeCommand(
      root,
      process.execPath,
      ["--input-type=module", "--eval", code],
      env,
    );
    assert.match(output, /source metadata unavailable/);
    const events = readFileSync(audit, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    assert.equal(events.length, 1);
    assert.equal(events[0].kind, "unavailable-metadata");
    assert.equal(events[0].code, "ENOENT");
    absentControls.push({ kind, output, events });
    writeFileSync(audit, "");
  }
  const ancestor = nativeCommand(
    root,
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `import fs from 'node:fs';if(!fs.lstatSync(${JSON.stringify(owner)}).isDirectory())throw Error('canonical traversal ancestor unavailable');console.log('ancestor identity only')`,
    ],
    env,
  );
  assert.match(ancestor, /ancestor identity only/);
  assert.equal(readFileSync(audit, "utf8"), "");
  writeFileSync(
    path.join(root, "metadata-absence-controls.json"),
    JSON.stringify(absentControls, null, 2),
  );
  assert.equal(lstatSync(link).isSymbolicLink(), true);
  unlinkSync(link);
  writeFileSync(
    path.join(root, "source-denial-controls.json"),
    JSON.stringify(controls, null, 2),
  );
  return { env, audit };
}

test(
  "genuine packed standalone Svelte library qualifies in independent Astro and SvelteKit applications",
  { timeout: 900_000 },
  async (t) => {
    const cli = installIndependentCli();
    // Retain this owned independent host/library for review; authoring copy/archive were already removed by the helper.
    const library = path.join(cli.root, "library");
    clone("tests/fixtures/library", library);
    nativeArchive(library, cli.packageRoot);
    mkdirSync(path.join(library, "src/lib/_kit"), { recursive: true });
    cpSync(
      path.join(library, "kit-intent.json"),
      path.join(library, "src/lib/_kit/kit.json"),
    );
    cpSync(
      path.join(owner, "tests/fixtures/astro-consumer/src/styles"),
      path.join(library, "src/styles"),
      { recursive: true },
    );
    const logs: Record<string, string> = {};
    setup(library, logs);
    const manifestBefore = readFileSync(
      path.join(library, "package.json"),
      "utf8",
    );
    for (const args of [
      ["init"],
      ["add", "button"],
      ["add", "field"],
      ["add", "dialog"],
      ["sync"],
    ])
      logs[args.join(" ")] = cliResult(cli, library, args);
    assert.equal(
      readFileSync(path.join(library, "package.json"), "utf8"),
      manifestBefore,
    );
    assert.equal(existsSync(path.join(library, "src/routes")), false);
    const before = snapshotTree(library);
    for (const args of [
      ["info"],
      ["doctor"],
      ["sync", "--dry-run"],
      ["sync"],
      ["init"],
    ]) {
      logs[args.join(" ")] = cliResult(cli, library, args);
      assert.deepEqual(snapshotTree(library), before, args.join(" "));
    }
    logs.check = nativeCommand(library, "pnpm", ["run", "check"]);
    assert.match(logs.check, /svelte-check found 0 errors and 0 warnings/);
    logs.build = nativeCommand(library, "pnpm", ["run", "build"]);
    const archives = path.join(cli.root, "library-archives");
    mkdirSync(archives);
    logs.pack = nativeCommand(library, "pnpm", [
      "pack",
      "--json",
      "--pack-destination",
      archives,
    ]);
    const names = readdirSync(archives);
    assert.equal(names.length, 1);
    const archive = path.join(archives, names[0]);
    const inspection = path.join(cli.root, "library-packed-inspection");
    mkdirSync(inspection);
    nativeCommand(library, "tar", ["-xf", archive, "-C", inspection]);
    const packed = path.join(inspection, "package"),
      pkg = JSON.parse(readFileSync(path.join(packed, "package.json"), "utf8"));
    assert.equal(pkg.name, libraryName);
    assert.equal(pkg.peerDependencies.svelte, workspace.catalog.svelte);
    assert.equal(pkg.peerDependencies["bits-ui"], NATIVE_BASELINE.version);
    assert.equal(pkg.dependencies, undefined);
    assert.equal(pkg.exports["."].svelte, "./dist/index.js");
    assert.equal(pkg.exports["."].types, "./dist/index.d.ts");
    assert.ok(
      readFileSync(path.join(packed, "dist/index.d.ts"), "utf8").includes(
        "Button",
      ),
    );
    for (const file of [
      "src/lib/index.ts",
      "src/lib/_kit/kit.lock.json",
      "src/styles.css",
    ])
      assert.equal(
        sha256Hex(readFileSync(path.join(packed, file))),
        sha256Hex(readFileSync(path.join(library, file))),
      );
    const lineage = JSON.parse(
      readFileSync(path.join(packed, "src/lib/_kit/kit.lock.json"), "utf8"),
    );
    assert.equal(lineage.target, "svelte-library");
    assert.deepEqual(lineage.requested, ["button", "dialog", "field"]);
    const retainedLibrary = path.join(cli.root, "retained-generated-library");
    renameSync(library, retainedLibrary);
    assert.equal(existsSync(library), false);
    t.after(() => {
      if (existsSync(retainedLibrary) && !existsSync(library))
        renameSync(retainedLibrary, library);
    });
    writeFileSync(
      path.join(retainedLibrary, "verification-commands.json"),
      JSON.stringify(logs, null, 2),
    );
    const base = path.join(owner, ".artifacts/verification/runtime-projects");
    mkdirSync(base, { recursive: true });
    assert.equal(lstatSync(base).isSymbolicLink(), false);
    const batch = realpathSync(
      mkdtempSync(path.join(base, "library-consumers-")),
    );
    const evidence = {
      library: retainedLibrary,
      archive,
      archiveSha256: sha256Hex(readFileSync(archive)),
      packedLineageSha256: sha256Hex(
        readFileSync(path.join(packed, "src/lib/_kit/kit.lock.json")),
      ),
      consumers: [] as unknown[],
    };
    for (const framework of ["astro", "sveltekit"] as const) {
      await t.test(`${framework} native packed consumer`, async (child) => {
        assert.equal(existsSync(library), false);
        const root = realpathSync(
          mkdtempSync(path.join(batch, `${framework}-`)),
        );
        clone(
          framework === "astro"
            ? "tests/fixtures/astro-consumer"
            : "tests/fixtures/library-kit-consumer",
          root,
        );
        nativeArchive(root, cli.packageRoot);
        const app = JSON.parse(
          readFileSync(path.join(root, "package.json"), "utf8"),
        );
        mkdirSync(path.join(root, "vendor"));
        cpSync(archive, path.join(root, "vendor/library.tgz"));
        app.dependencies[libraryName] = "file:./vendor/library.tgz";
        writeFileSync(
          path.join(root, "package.json"),
          JSON.stringify(app, null, 2) + "\n",
        );
        const authored = readFileSync(
          path.join(
            owner,
            "tests/fixtures/astro-consumer/src/components/Island.svelte",
          ),
          "utf8",
        );
        assert.equal(authored.split("../generated/ui/index.js").length, 2);
        const island = path.join(
          root,
          framework === "astro"
            ? "src/components/Island.svelte"
            : "src/lib/Island.svelte",
        );
        mkdirSync(path.dirname(island), { recursive: true });
        writeFileSync(
          island,
          authored.replace("../generated/ui/index.js", libraryName),
        );
        if (framework === "astro") {
          const file = path.join(root, "src/layouts/Layout.astro"),
            source = readFileSync(file, "utf8");
          assert.ok(source.startsWith("---\n"));
          writeFileSync(
            file,
            source.replace(
              "---\n",
              `---\nimport "${libraryName}/styles.css";\n`,
            ),
          );
        }
        const nativeLogs: Record<string, string> = {};
        setup(root, nativeLogs);
        assert.equal(existsSync(path.join(root, "src/generated/ui")), false);
        assert.equal(
          realpathSync(path.join(root, "node_modules", libraryName)).startsWith(
            path.join(root, "node_modules") + path.sep,
          ),
          true,
        );
        const guarded = sourceGuard(root);
        nativeLogs.check = nativeCommand(
          root,
          "pnpm",
          ["run", "check"],
          guarded.env,
        );
        assert.match(
          nativeLogs.check,
          /svelte-check found 0 errors and 0 warnings/,
        );
        if (framework === "astro")
          assert.match(
            nativeLogs.check,
            /Result \(([1-9]\d*) files\):\s*\n- 0 errors\s*\n- 0 warnings/,
          );
        nativeLogs.build = nativeCommand(
          root,
          "pnpm",
          ["run", "build"],
          guarded.env,
        );
        writeFileSync(
          path.join(root, "verification-commands.json"),
          JSON.stringify(nativeLogs, null, 2),
        );
        await verifyTargetConsumer(
          {
            root,
            framework,
            commands: Object.keys(nativeLogs),
            env: guarded.env,
          },
          child,
        );
        const absences = readFileSync(guarded.audit, "utf8")
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line));
        for (const event of absences) {
          assert.equal(
            event.kind,
            "unavailable-metadata",
            JSON.stringify(event),
          );
          assert.equal(event.code, "ENOENT");
          assert.match(
            event.operation,
            /^(stat|lstat|realpath|readlink|access|exists)(Sync)?$/,
          );
          assert.equal(typeof event.locator, "string");
        }
        writeFileSync(
          path.join(root, "enforced-native-metadata-absences.json"),
          JSON.stringify(absences, null, 2),
        );
        evidence.consumers.push({
          framework,
          root,
          sourceDenials: 4,
          metadataAbsenceControls: 6,
          inheritedPnpmGuardControls: 2,
          enforcedMetadataAbsences: absences.length,
          status: "pass",
        });
      });
    }
    renameSync(retainedLibrary, library);
    evidence.library = library;
    writeFileSync(
      path.join(batch, "library-verification.json"),
      JSON.stringify(evidence, null, 2),
    );
    console.log(
      `Retained packed library and consumers: ${JSON.stringify(evidence)}`,
    );
  },
);
