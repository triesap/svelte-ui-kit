/** Real producer, archive and public consumer controls for R11-F02. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { gzipSync, gunzipSync } from "node:zlib";
import {
  buildNativeDependency,
  nativeDigest,
  NATIVE_RECIPE,
  normalizePackedArchive,
} from "./build-native-dependency.mjs";

const repository = fileURLToPath(new URL("../", import.meta.url));
test("canonical packing removes OS entropy while preserving genuine content and refusing corrupt input", (t) => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-gzip-control-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const content = Buffer.from("actual owned package content\n");
  const outputs = [];
  for (const osByte of [3, 19]) {
    const file = path.join(root, `os-${osByte}.tgz`);
    const bytes = gzipSync(content);
    bytes[9] = osByte;
    writeFileSync(file, bytes);
    normalizePackedArchive(file);
    const normalized = readFileSync(file);
    assert.equal(normalized[9], 255);
    assert.deepEqual(gunzipSync(normalized), content);
    outputs.push(normalized);
  }
  assert.deepEqual(outputs[0], outputs[1]);
  for (const mutation of [
    (bytes) => {
      bytes[0] = 0;
    },
    (bytes) => {
      bytes[3] = 2;
    },
    (bytes) => {
      bytes[4] = 1;
    },
    (bytes) => {
      bytes[bytes.length - 8] ^= 1;
    },
  ]) {
    const file = path.join(root, "invalid.tgz");
    const bytes = gzipSync(content);
    mutation(bytes);
    writeFileSync(file, bytes);
    assert.throws(() => normalizePackedArchive(file));
    assert.deepEqual(readFileSync(file), bytes);
  }
});
const env = { ...process.env, npm_config_verify_deps_before_run: "false" };
for (const name of ["NODE_TEST_CONTEXT", "NODE_OPTIONS", "NODE_V8_COVERAGE"])
  delete env[name];
const positive = `
import { Button, Calendar, Dialog } from 'bits-ui';
import type { Component, Snippet } from 'svelte';
import { CalendarDate } from '@internationalized/date';
type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type ActualButton = Parameters<typeof Button.Root>[1];
type ActualCalendar = Parameters<typeof Calendar.Root>[1];
export type ButtonToNative = Assert<ActualButton extends Button.RootProps ? true : false>;
export type NativeToButton = Assert<Button.RootProps extends ActualButton ? true : false>;
export type CalendarToNative = Assert<ActualCalendar extends Calendar.RootProps ? true : false>;
export type NativeToCalendar = Assert<Calendar.RootProps extends ActualCalendar ? true : false>;
export type ButtonBindings = Assert<Equal<NonNullable<typeof Button.Root['z_$$bindings']>, 'ref'>>;
export type CalendarBindings = Assert<Equal<NonNullable<typeof Calendar.Root['z_$$bindings']>, 'ref' | 'value' | 'placeholder'>>;
export type NoConstructor = Assert<typeof Button.Root extends abstract new (...args: never[]) => unknown ? false : true>;
declare const oldDialog: Component<Dialog.RootProps, {}, 'open'>;
const fromOld: typeof Dialog.Root = oldDialog;
const toOld: typeof oldDialog = Dialog.Root;
void fromOld; void toOld;
declare const content: Snippet;
declare const calendarChildren: NonNullable<Calendar.RootProps['children']>;
declare const calendarChild: NonNullable<Calendar.RootProps['child']>;
export const button: ActualButton = { type: 'submit', disabled: true, ref: document.createElement('button'), children: content,
  onclick: event => { const element: HTMLButtonElement = event.currentTarget; element.focus(); event.preventDefault(); } };
export const link: ActualButton = { href: '/target', ref: document.createElement('a'), 'aria-label': 'target', children: content };
export const calendar: ActualCalendar = { type: 'single', value: new CalendarDate(2026, 10, 8), placeholder: new CalendarDate(2026, 10, 1),
  onValueChange: value => { const v: import('@internationalized/date').DateValue | undefined = value; void v; }, children: calendarChildren, child: calendarChild, ref: document.createElement('div') };
export const multiple: ActualCalendar = { type: 'multiple', value: [new CalendarDate(2026, 10, 8)], onValueChange: value => { const list: import('@internationalized/date').DateValue[] = value; void list; } };
`;
const negatives = {
  "button-discriminant": `const bad: Parameters<typeof Button.Root>[1] = { href: '/target', type: 'submit' }; void bad;`,
  "button-ref": `const bad: Parameters<typeof Button.Root>[1] = { ref: 123 }; void bad;`,
  "button-event": `const bad: Parameters<typeof Button.Root>[1] = { onclick: (event: string) => { void event; } }; void bad;`,
  "button-snippet": `const bad: Parameters<typeof Button.Root>[1] = { children: 'text' }; void bad;`,
  "button-bindings": `const bad: NonNullable<typeof Button.Root['z_$$bindings']> = 'disabled'; void bad;`,
  "calendar-discriminant": `const bad: Parameters<typeof Calendar.Root>[1] = { type: 'single', value: [] }; void bad;`,
  "calendar-callback": `const bad: Parameters<typeof Calendar.Root>[1] = { type: 'multiple', onValueChange: (value: boolean) => { void value; } }; void bad;`,
  "calendar-child": `const bad: Parameters<typeof Calendar.Root>[1] = { type: 'single', child: 'text' }; void bad;`,
  "calendar-bindings": `const bad: NonNullable<typeof Calendar.Root['z_$$bindings']> = 'disabled'; void bad;`,
  "legacy-constructor": `const bad: new (...args: never[]) => unknown = Button.Root; void bad;`,
};
const nativePage = `<script lang="ts">
  import { Button, Calendar, Dialog } from 'bits-ui';
  import { CalendarDate, type DateValue } from '@internationalized/date';
  let buttonRef = $state<HTMLElement | null>(null);
  let calendarRef = $state<HTMLElement | null>(null);
  let value = $state<DateValue>();
  let placeholder = $state<DateValue>(new CalendarDate(2026, 10, 8));
  let open = $state(false);
</script>
<Button.Root bind:ref={buttonRef} type="button">native button</Button.Root>
<Calendar.Root type="single" bind:value bind:placeholder bind:ref={calendarRef}>
  {#snippet children({weekdays})}<div>{weekdays.join(', ')}</div>{/snippet}
</Calendar.Root>
<Dialog.Root bind:open><Dialog.Trigger>native dialog</Dialog.Trigger></Dialog.Root>
`;

test("producer refuses existing output and linked ancestry without changing either tree", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-producer-boundary-"));
  try {
    const output = path.join(root, "existing");
    mkdirSync(output);
    const sentinel = path.join(output, "sentinel");
    writeFileSync(sentinel, "preserve original bytes\n", { mode: 0o600 });
    assert.throws(
      () => buildNativeDependency({ output }),
      /must not already exist/,
    );
    const linked = path.join(root, "linked");
    symlinkSync(output, linked);
    assert.throws(
      () => buildNativeDependency({ output: path.join(linked, "nested") }),
      /unsafe output ancestry/,
    );
    const dangling = path.join(root, "dangling");
    symlinkSync(path.join(root, "absent"), dangling);
    assert.throws(
      () => buildNativeDependency({ output: dangling }),
      /unsafe output ancestry/,
    );
    assert.equal(readFileSync(sentinel, "utf8"), "preserve original bytes\n");
    assert.deepEqual(readdirSync(output), ["sentinel"]);
    assert.equal(existsSync(path.join(root, "absent")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test(
  "real frozen producer is reproducible, preserves runtime and rejects invalid public props",
  { timeout: 900_000 },
  () => {
    const root = mkdtempSync(
      path.join(os.tmpdir(), "suik-native-qualification-"),
    );
    const logs = path.join(
      repository,
      ".artifacts/verification/native-producer",
    );
    mkdirSync(logs, { recursive: true });
    const reportFile = path.join(logs, `${process.pid}-${Date.now()}.json`);
    const report = { commands: [], types: {} };
    const save = () =>
      writeFileSync(reportFile, JSON.stringify(report, null, 2));
    function run(command, args, cwd, expected = 0) {
      const result = spawnSync(command, args, {
        cwd,
        env,
        encoding: "utf8",
        timeout: 240_000,
        maxBuffer: 64 * 1024 * 1024,
      });
      report.commands.push({
        command,
        args,
        status: result.status,
        signal: result.signal,
        error: result.error?.message ?? null,
        stdout: result.stdout,
        stderr: result.stderr,
      });
      save();
      assert.equal(result.error, undefined);
      assert.equal(result.signal, null);
      assert.equal(result.status, expected, result.stdout + result.stderr);
      return result;
    }
    try {
      const artifacts = {};
      for (const name of ["first", "second", "baseline"]) {
        const output = path.join(root, name);
        const provenance = buildNativeDependency({
          output,
          baseline: name === "baseline",
          report: path.join(
            logs,
            `${path.basename(reportFile, ".json")}-${name}.json`,
          ),
        });
        const archive = path.join(output, provenance.archive);
        assert.equal(
          nativeDigest(readFileSync(archive)),
          provenance.archiveSha256,
        );
        const unpacked = path.join(output, "unpacked");
        mkdirSync(unpacked);
        run("tar", ["-xf", archive, "-C", unpacked], root);
        const packageRoot = path.join(unpacked, "package");
        const manifest = JSON.parse(
          readFileSync(path.join(packageRoot, "package.json"), "utf8"),
        );
        assert.equal(manifest.name, "bits-ui");
        assert.equal(manifest.version, NATIVE_RECIPE.native.buildVersion);
        assert.equal(manifest.devDependencies, undefined);
        assert.equal(manifest.scripts, undefined);
        assert.deepEqual(
          manifest.dependencies,
          NATIVE_RECIPE.nativeDependencies,
        );
        assert.equal(manifest.peerDependencies.svelte, "^5.33.0");
        assert.equal(
          manifest.peerDependencies["@internationalized/date"],
          "^3.8.1",
        );
        assert.ok(manifest.exports["."]);
        assert.ok(
          readFileSync(path.join(packageRoot, "LICENSE"), "utf8").includes(
            "MIT",
          ),
        );
        assert.ok(
          readFileSync(
            path.join(packageRoot, "EMITTER_LICENSE"),
            "utf8",
          ).includes("MIT"),
        );
        assert.deepEqual(
          JSON.parse(
            readFileSync(
              path.join(packageRoot, "NATIVE_PROVENANCE.json"),
              "utf8",
            ),
          ),
          Object.fromEntries(
            Object.entries(provenance).filter(
              ([key]) => key !== "archive" && key !== "archiveSha256",
            ),
          ),
        );
        for (const file of provenance.distributionFiles) {
          assert.equal(
            nativeDigest(
              readFileSync(path.join(packageRoot, ...file.path.split("/"))),
            ),
            file.sha256,
          );
        }
        artifacts[name] = { archive, provenance, packageRoot };
      }
      assert.deepEqual(artifacts.first.provenance, artifacts.second.provenance);
      assert.deepEqual(
        readFileSync(artifacts.first.archive),
        readFileSync(artifacts.second.archive),
      );
      report.reproducibleArchiveSha256 =
        artifacts.first.provenance.archiveSha256;
      const files = (directory, prefix = "") =>
        readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
          entry.isDirectory()
            ? files(path.join(directory, entry.name), `${prefix}${entry.name}/`)
            : [`${prefix}${entry.name}`],
        );
      const fixedFiles = files(path.join(artifacts.first.packageRoot, "dist"));
      assert.deepEqual(
        fixedFiles,
        files(path.join(artifacts.baseline.packageRoot, "dist")),
      );
      let unchanged = 0;
      for (const file of fixedFiles) {
        const bytes = readFileSync(
          path.join(artifacts.first.packageRoot, "dist", file),
        );
        assert.ok(
          !bytes.includes(Buffer.from(root)),
          `private producer path in ${file}`,
        );
        if (!file.endsWith(".svelte.d.ts")) {
          assert.deepEqual(
            bytes,
            readFileSync(
              path.join(artifacts.baseline.packageRoot, "dist", file),
            ),
            `runtime or prop declaration changed: ${file}`,
          );
          unchanged++;
        }
      }
      report.unchangedRuntimeAndPropFiles = unchanged;
      for (const name of ["baseline", "first"]) {
        const consumer = path.join(root, `${name}-consumer`);
        const excluded = new Set([
          "node_modules",
          ".svelte-kit",
          "build",
          "dist",
          "coverage",
          "pnpm-lock.yaml",
        ]);
        cpSync(path.join(repository, "tests/fixtures/consumer"), consumer, {
          recursive: true,
          filter: (source) => !excluded.has(path.basename(source)),
        });
        const archiveName = path.basename(artifacts[name].archive);
        cpSync(artifacts[name].archive, path.join(consumer, archiveName));
        const manifest = JSON.parse(
          readFileSync(path.join(consumer, "package.json"), "utf8"),
        );
        manifest.packageManager = "pnpm@11.22.0";
        manifest.dependencies["bits-ui"] = `file:./${archiveName}`;
        writeFileSync(
          path.join(consumer, "package.json"),
          JSON.stringify(manifest),
        );
        const config = JSON.parse(
          readFileSync(path.join(consumer, "tsconfig.json"), "utf8"),
        );
        config.compilerOptions.skipLibCheck = false;
        writeFileSync(
          path.join(consumer, "tsconfig.json"),
          JSON.stringify(config),
        );
        run(
          "pnpm",
          [
            "install",
            "--ignore-scripts",
            "--strict-peer-dependencies",
            "--engine-strict",
          ],
          consumer,
        );
        const require = createRequire(path.join(consumer, "package.json"));
        const ts = require("typescript");
        const shims = path.join(
          consumer,
          "node_modules/svelte-check/dist/src/svelte-shims-v4.d.ts",
        );
        const sourceFile = path.join(consumer, "native-control.ts");
        const options = {
          strict: true,
          skipLibCheck: false,
          noEmit: true,
          target: ts.ScriptTarget.ES2023,
          module: ts.ModuleKind.ESNext,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          types: ["node"],
          lib: ["lib.es2023.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
        };
        function check(source) {
          writeFileSync(sourceFile, source);
          return ts
            .getPreEmitDiagnostics(
              ts.createProgram([sourceFile, shims], options),
            )
            .map((d) => ({
              code: d.code,
              file: d.file && path.relative(consumer, d.file.fileName),
              message: ts.flattenDiagnosticMessageText(d.messageText, "\n"),
            }));
        }
        const publicEntry = `import { Button, Calendar } from 'bits-ui'; void Button.Root; void Calendar.Root;`;
        const diagnostics = check(publicEntry);
        report.types[name] = diagnostics;
        save();
        if (name === "baseline") {
          assert.equal(diagnostics.length, 2);
          assert.ok(diagnostics.every((d) => d.code === 2590));
          const result = run("pnpm", ["run", "check"], consumer, 1);
          assert.match(result.stdout, /2 errors and 0 warnings/);
        } else {
          assert.deepEqual(diagnostics, []);
          const contracts = check(positive);
          report.types.positive = contracts;
          save();
          assert.deepEqual(contracts, []);
          for (const [label, source] of Object.entries(negatives)) {
            const errors = check(`${publicEntry}\n${source}`);
            report.types[label] = errors;
            save();
            assert.equal(errors.length, 1, label);
            assert.equal(errors[0].file, "native-control.ts", label);
            assert.ok(
              [2322, 2353, 7009, 2554].includes(errors[0].code),
              `${label}: ${errors[0].code}`,
            );
          }
          // These are raw checker/compiler exits, independent of diagnostic parsing.
          writeFileSync(sourceFile, positive);
          const nativePageFile = path.join(
            consumer,
            "src/routes/native-qualification/+page.svelte",
          );
          mkdirSync(path.dirname(nativePageFile), { recursive: true });
          writeFileSync(nativePageFile, nativePage);
          const strict = run("pnpm", ["run", "check"], consumer);
          assert.match(strict.stdout, /0 errors and 0 warnings/);
          for (const family of ["Button", "Calendar"]) {
            writeFileSync(
              nativePageFile,
              `<script lang="ts">import { ${family} } from 'bits-ui'; let disabled = $state(false);</script>\n<${family}.Root ${family === "Calendar" ? 'type="single"' : ""} bind:disabled>invalid</${family}.Root>\n`,
            );
            const rejected = run("pnpm", ["run", "check"], consumer, 1);
            assert.match(
              rejected.stdout,
              /Cannot use 'bind:' with this property\. It is declared as non-bindable inside the component\./,
            );
            assert.match(rejected.stdout, /1 error and 0 warnings/);
          }
          writeFileSync(nativePageFile, nativePage);
          writeFileSync(
            path.join(consumer, "tsconfig.native.json"),
            JSON.stringify({
              compilerOptions: {
                strict: true,
                skipLibCheck: false,
                noEmit: true,
                target: "ES2023",
                module: "ESNext",
                moduleResolution: "Bundler",
                types: ["node"],
                lib: ["ES2023", "DOM", "DOM.Iterable"],
              },
              files: ["native-control.ts", shims],
            }),
          );
          run(
            process.execPath,
            [
              path.join(consumer, "node_modules/typescript/bin/tsc"),
              "-p",
              "tsconfig.native.json",
            ],
            consumer,
          );
          run("pnpm", ["run", "build"], consumer);
          assert.ok(existsSync(path.join(consumer, "build/index.js")));
        }
      }
      report.qualifiedProducer = true;
      save();
    } finally {
      rmSync(root, { recursive: true, force: true });
      report.ownedProjectsRemoved = !existsSync(root);
      save();
    }
  },
);
