import { pathToFileURL } from "node:url";
import { verifyShowcase } from "../helpers/showcase-browser.js";
import { documentedExample } from "../helpers/documented-example.js";
import {
  nativeCommand as command,
  verifyTargetConsumer,
} from "../helpers/target-consumer.js";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { prepareOfflineInstall } from "../helpers/package-manager.js";
import { writeFixtureWorkspace } from "../helpers/workspace-catalog.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import {
  installIndependentCli,
  runtimeGuard,
  selectedArchive,
} from "../helpers/packaged-cli.js";
import {
  NATIVE_BASELINE,
  SVELTE_RUNTIME_BASELINE,
} from "../../src/project/native-dependency.js";
import { sha256Hex } from "../../src/codegen/digest.js";

const owner = process.cwd();
test("real generated Astro consumer checks, builds, serves SSR and hydrates independent islands", {
  timeout: 360_000,
}, async (t) => {
  const installed = installIndependentCli();
  const root = path.join(installed.root, `astro-${randomUUID()}`);
  function cli(root: string, ...args: string[]) {
    return invoke(root, args, 30_000);
  }
  function invoke(root: string, args: string[], deadlineMs: number) {
    const result = installed.runNode(
      [
        path.join(installed.packageRoot, "dist/cli/main.js"),
        "--cwd",
        root,
        ...args,
        "--json",
      ],
      root,
      "generated-astro-cli",
      deadlineMs,
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.stderr, "");
    assert.deepEqual(result.guardEvents, []);
    return result.stdout;
  }
  mkdirSync(root, { recursive: true });
  const blueprint = path.join(owner, "tests/fixtures/astro-consumer");
  cpSync(blueprint, root, {
    recursive: true,
    filter: (source) =>
      !source
        .split(path.sep)
        .some((part) => ["node_modules", ".astro", "dist"].includes(part)),
  });
  writeFixtureWorkspace(root, owner);
  const manifest = JSON.parse(
    readFileSync(path.join(root, "package.json"), "utf8"),
  );
  for (const profile of [NATIVE_BASELINE, SVELTE_RUNTIME_BASELINE]) {
    const archive = `vendor/${profile.archive}`;
    const bytes = readFileSync(
      path.join(installed.packageRoot, "dist/native", profile.archive),
    );
    assert.equal(sha256Hex(bytes), profile.archiveSha256);
    mkdirSync(path.dirname(path.join(root, archive)), { recursive: true });
    writeFileSync(path.join(root, archive), bytes);
    manifest.dependencies[profile.name] = `file:./${archive}`;
  }
  writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify(manifest, null, 2),
  );
  const documentedLayout = documentedExample(
    "docs/guides/astro.md",
    "documented-astro-layout",
    "astro",
  );
  const witnessedLayout = documentedLayout
    .replace(
      "const { title } = Astro.props;",
      'const { title } = Astro.props;\nconst witness = process.env.OWNED_FIXTURE_WITNESS ?? "unqualified";',
    )
    .replace(
      "<title>",
      '<meta name="fixture-witness" content={witness} /><title>',
    );
  assert.notEqual(witnessedLayout, documentedLayout);
  writeFileSync(path.join(root, "src/layouts/Layout.astro"), witnessedLayout);
  writeFileSync(
    path.join(root, "astro.config.ts"),
    documentedExample("docs/guides/astro.md", "documented-astro-config", "ts"),
  );
  writeFileSync(
    path.join(root, "src/components/Island.svelte"),
    documentedExample(
      "docs/guides/astro.md",
      "documented-astro-island",
      "svelte",
    ),
  );
  writeFileSync(
    path.join(root, "src/pages/index.astro"),
    documentedExample("docs/guides/astro.md", "documented-astro-page", "astro"),
  );
  const state = path.join(root, "src/generated/ui/_kit");
  mkdirSync(state, { recursive: true });
  writeFileSync(
    path.join(state, "kit.json"),
    documentedExample(
      "docs/guides/astro.md",
      "documented-astro-intent",
      "json",
    ),
  );
  const logs: Record<string, string> = {};
  const dependencyInputs = prepareOfflineInstall(
    root,
    (args, stage) => {
      logs[stage] = command(root, "pnpm", args);
    },
    "astro-consumer-install",
  );
  writeFileSync(
    path.join(root, "dependency-inputs.json"),
    JSON.stringify(dependencyInputs, null, 2),
  );
  const manifestBefore = readFileSync(path.join(root, "package.json"), "utf8");
  const layoutBefore = readFileSync(
    path.join(root, "src/layouts/Layout.astro"),
    "utf8",
  );
  logs.init = cli(root, "init");
  for (const item of ["button", "field", "menu", "dialog"])
    logs[item] = cli(root, "add", item);
  logs.sync = cli(root, "sync");
  assert.equal(
    readFileSync(path.join(root, "package.json"), "utf8"),
    manifestBefore,
  );
  const generated = readFileSync(
    path.join(root, "src/layouts/Layout.astro"),
    "utf8",
  );
  assert.ok(
    generated.endsWith(
      layoutBefore.slice(layoutBefore.indexOf("interface Props")),
    ),
  );
  const before = snapshotTree(root);
  for (const args of [
    ["info"],
    ["doctor"],
    ["sync", "--dry-run"],
    ["sync"],
    ["init"],
  ]) {
    logs[args.join(" ")] = cli(root, ...args);
    assert.deepEqual(snapshotTree(root), before, args.join(" "));
  }
  // Use the public example from the actual independent package, never a
  // private gallery copy. Preserve the original two-island route above.
  const desiredPath = path.join(state, "kit.json");
  const desired = JSON.parse(readFileSync(desiredPath, "utf8"));
  const catalog: string[] = JSON.parse(
    readFileSync(
      path.join(installed.packageRoot, "assets/registry/registry.json"),
      "utf8",
    ),
  )
    .items.map((item: { id: string }) => item.id)
    .sort();
  desired.requested = catalog;
  writeFileSync(desiredPath, JSON.stringify(desired, null, 2));
  logs["showcase-sync-plan"] = cli(root, "sync", "--dry-run");
  // New bulk-catalog setup uses the installed mutation lane; original
  // controls and cold parser retain their original 30-second deadline.
  logs["showcase-sync"] = invoke(root, ["sync"], 300_000);
  const example = path.join(installed.packageRoot, "examples/showcase");
  // Use the compiled setup helper shipped in the installed package.
  const { materializeShowcase, showcaseHost } = await import(
    pathToFileURL(path.join(installed.packageRoot, "dist/examples/showcase.js"))
      .href
  );
  const destination = path.join(root, "src/lib/showcase");
  mkdirSync(path.dirname(destination), { recursive: true });
  const binding = materializeShowcase(
    example,
    destination,
    "../../generated/ui/index.js",
  );
  const host = showcaseHost(
    example,
    "astro",
    "../styles/kit.css",
    "../lib/showcase/Gallery.svelte",
  );
  writeFileSync(path.join(root, "src/pages/showcase.astro"), host.text, {
    flag: "wx",
  });
  mkdirSync(path.join(root, "public"), { recursive: true });
  writeFileSync(
    path.join(root, "public/showcase-avatar.svg"),
    readFileSync(path.join(destination, "avatar.svg")),
    { flag: "wx" },
  );
  writeFileSync(
    path.join(root, "showcase-binding.json"),
    JSON.stringify({ binding, host, catalog }, null, 2),
  );
  rmSync(path.join(installed.root, "host"), { recursive: true });
  assert.equal(existsSync(installed.packageRoot), false);
  const audit = path.join(root, "source-audit.jsonl");
  const guard = path.join(root, "source-guard.cjs");
  const selected = selectedArchive();
  writeFileSync(audit, "");
  writeFileSync(
    guard,
    runtimeGuard(
      owner,
      audit,
      null,
      true,
      selected ? [selected.path] : [],
      true,
    ),
  );
  const guardedEnv = { NODE_OPTIONS: `--require ${JSON.stringify(guard)}` };
  const actual = path.join(owner, "package.json");
  const link = path.join(root, "source-link");
  symlinkSync(actual, link);
  for (const [kind, script] of [
    ["read", `require('node:fs').readFileSync(${JSON.stringify(actual)})`],
    ["symlink", `require('node:fs').readFileSync(${JSON.stringify(link)})`],
    ["directory", `require('node:fs').readdirSync(${JSON.stringify(owner)})`],
    [
      "module",
      `await import(${JSON.stringify(path.join(owner, "dist/project/config.js"))})`,
    ],
  ]) {
    const program = `const require=(await import('node:module')).createRequire(import.meta.url);try{${script};throw Error('source control failed')}catch(e){if(e.code!=='OWNED_AUTHORING_UNAVAILABLE')throw e;console.log(e.code)}`;
    logs[`guard-${kind}`] = command(
      root,
      process.execPath,
      ["--input-type=module", "--eval", program],
      guardedEnv,
    );
    assert.match(logs[`guard-${kind}`]!, /OWNED_AUTHORING_UNAVAILABLE/);
    const events = readFileSync(audit, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    assert.deepEqual(events, [
      { kind: "authoring-access", code: "OWNED_AUTHORING_UNAVAILABLE" },
    ]);
    writeFileSync(audit, "");
  }
  logs.check = command(root, "pnpm", ["run", "check"], guardedEnv);
  assert.match(
    logs.check,
    /Result \(([1-9]\d*) files\):\s*\n- 0 errors\s*\n- 0 warnings/,
  );
  assert.match(logs.check, /svelte-check found 0 errors and 0 warnings/);
  logs.build = command(root, "pnpm", ["run", "build"], guardedEnv);
  const metadataAbsences = () => {
    const events = readFileSync(audit, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    for (const event of events) {
      assert.equal(event.kind, "unavailable-metadata", JSON.stringify(event));
      assert.equal(event.code, "ENOENT");
      assert.match(
        event.operation,
        /^(stat|lstat|realpath|readlink|access|exists)(Sync)?$/,
      );
      assert.equal(typeof event.locator, "string");
    }
    return events;
  };
  metadataAbsences();
  writeFileSync(
    path.join(root, "verification-commands.json"),
    JSON.stringify(logs, null, 2),
  );
  await verifyTargetConsumer(
    {
      root,
      framework: "astro",
      commands: Object.keys(logs),
      env: guardedEnv,
      verifyAdditional: (page, baseURL) =>
        verifyShowcase(
          page,
          new URL("showcase", baseURL).href,
          catalog,
          (name) => path.join(root, name),
        ),
    },
    t,
  );
  writeFileSync(
    path.join(root, "enforced-native-metadata-absences.json"),
    JSON.stringify(metadataAbsences(), null, 2),
  );
  writeFileSync(
    path.join(
      owner,
      ".artifacts/verification",
      `astro-${path.basename(root)}-identity.json`,
    ),
    JSON.stringify({ ...installed.evidence, consumer: root, logs }, null, 2),
  );
  // Keep browser captures/consumer evidence. The independent host is retained
  // with them; no server remains after verifyTargetConsumer returns.
});
