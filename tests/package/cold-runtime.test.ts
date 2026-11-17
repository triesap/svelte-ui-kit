import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { installIndependentCli } from "../helpers/packaged-cli.js";

test("fresh installed processes load the native Astro parser and initialize each target within the original bound", () => {
  const cli = installIndependentCli();
  const records: unknown[] = [];
  const folder = path.resolve(".artifacts/verification/cold-runtime");
  mkdirSync(folder, { recursive: true });
  const report = path.join(folder, `${process.pid}-${Date.now()}.json`);
  let passed = false;
  const save = () =>
    writeFileSync(
      report,
      JSON.stringify(
        { passed, archive: cli.evidence, root: cli.root, records },
        null,
        2,
      ),
    );
  save();
  try {
    const module = pathToFileURL(
      path.join(cli.packageRoot, "dist/codegen/astro.js"),
    ).href;
    const worker = `import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(${JSON.stringify(path.join(cli.packageRoot, "package.json"))});
const entry=require.resolve('@astrojs/compiler-rs');
assert.equal(require.cache[entry],undefined,'native parser starts unloaded');
const {inspectAstroLayout,patchAstroLayout}=await import(${JSON.stringify(module)});
assert.equal(require.cache[entry],undefined,'importing the adapter does not load the native addon');
const result=inspectAstroLayout('---\\nglobalThis.__ownedColdEvaluated = true;\\n---\\n<main><slot /></main>');
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.value.rendersContent,true);
assert.equal(globalThis.__ownedColdEvaluated,undefined,'native parsing never evaluates frontmatter');
assert.ok(require.cache[entry],'the actual native parser was loaded');
assert.equal(patchAstroLayout('<main><slot name="unsupported" /></main>',[]).ok,false);
console.log(JSON.stringify({pid:process.pid,node:process.version,nativeEntry:entry,parsed:true,lazy:true,frontmatterEvaluated:false}));`;
    for (let sample = 0; sample < 2; sample++) {
      const result = cli.runNode(
        ["--input-type=module", "--eval", worker],
        cli.root,
        `cold-native-parser-${sample}`,
        30_000,
      );
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.equal(result.stderr, "");
      assert.deepEqual(result.guardEvents, []);
      const observation = JSON.parse(result.stdout);
      assert.equal(observation.pid, result.pid);
      records.push({
        kind: "native-parser",
        sample,
        deadlineMs: 30_000,
        ...observation,
      });
      save();
    }
    for (const target of ["sveltekit", "astro", "svelte-library"] as const) {
      const app = cli.prepareConsumer(false, "adoption", target);
      const result = cli.runNode(
        [
          path.join(cli.packageRoot, "dist/cli/main.js"),
          "init",
          "--json",
          "--cwd",
          app.root,
        ],
        app.root,
        `cold-${target}-init`,
        30_000,
      );
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.equal(result.stderr, "");
      assert.deepEqual(result.guardEvents, []);
      const envelope = JSON.parse(result.stdout);
      assert.equal(envelope.status, "success");
      const lock = JSON.parse(
        readFileSync(
          path.join(app.root, app.paths.stateDir, "kit.lock.json"),
          "utf8",
        ),
      );
      assert.equal(lock.target, target);
      records.push({
        kind: "init",
        target,
        pid: result.pid,
        cwd: app.root,
        deadlineMs: 30_000,
        status: result.status,
        signal: result.signal,
      });
      save();
    }
    passed = true;
    save();
  } finally {
    if (passed) cli.cleanup();
  }
});
