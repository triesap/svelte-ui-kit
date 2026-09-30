#!/usr/bin/env node
/**
 * S007 consumer fixture smoke suite.
 *
 * `pnpm run test:fixture` builds the maintained SvelteKit consumer fixture and
 * then runs this file. The suite starts the real Node-adapter production
 * handler through the owned-server boundary on an OS-assigned loopback port and
 * asserts the actual HTTP server-rendered HTML before any client JavaScript
 * runs. It also drives disposable copies of the fixture to prove that a real
 * Svelte/TypeScript mismatch fails `fixture:check`, that a real SSR-disabled
 * build fails only the missing-markup assertion, and that an HTTP 500 or a
 * wrong content type is rejected by the transport assertions.
 *
 * Every owned server is stopped and every owned temporary directory removed on
 * success and failure. No unrelated process is ever signalled.
 */
import { strict as assert } from "node:assert";
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
import os from "node:os";
import path from "node:path";
import { after, afterEach, before, test } from "node:test";

import {
  DEFAULT_LAUNCHER,
  fetchRoute,
  startOwnedServer,
} from "./owned-server.mjs";
import {
  assertHtmlTransport,
  assertServerRendered,
  missingSsrMarkupError,
  stripScripts,
} from "./ssr-assertions.mjs";

const PACKAGE_ROOT = process.cwd();
const FIXTURE_ROOT = path.join(PACKAGE_ROOT, "tests", "fixtures", "consumer");
const MAIN_HANDLER = path.join(FIXTURE_ROOT, "build", "handler.js");
const CHECK_TIMEOUT_MS = 120_000;
const BUILD_TIMEOUT_MS = 180_000;
const COPY_EXCLUDES = new Set([
  "node_modules",
  ".svelte-kit",
  "build",
  "dist",
  "coverage",
]);

/**
 * Link the fixture's installed packages into an owned copy.
 *
 * A direct `node_modules` directory symlink breaks pnpm's bin shims in the
 * copy: the shims resolve their package target relative to their own invoked
 * path, so a copied `node_modules/.bin/svelte-kit` resolves outside the repo.
 * Linking each package and each bin script individually keeps the copy's
 * package resolution and the shims' real path correct.
 */
function linkFixtureNodeModules(fixtureNodeModules, targetNodeModules) {
  mkdirSync(targetNodeModules, { recursive: true });
  for (const entry of readdirSync(fixtureNodeModules)) {
    if (entry === ".bin") continue;
    symlinkSync(
      path.join(fixtureNodeModules, entry),
      path.join(targetNodeModules, entry),
    );
  }
  const binDir = path.join(targetNodeModules, ".bin");
  mkdirSync(binDir, { recursive: true });
  for (const bin of readdirSync(path.join(fixtureNodeModules, ".bin"))) {
    symlinkSync(
      path.join(fixtureNodeModules, ".bin", bin),
      path.join(binDir, bin),
    );
  }
}

/**
 * Create an owned disposable copy of a fixture tree. The base directory is
 * registered for `t.after` cleanup immediately after allocation, before any
 * copy or link can throw; a synchronous setup failure also removes it before
 * rethrowing, so a failed setup cannot leak an owned directory.
 */
function createDisposableCopy(
  t,
  label,
  { source = FIXTURE_ROOT, parent = os.tmpdir() } = {},
) {
  const base = mkdtempSync(path.join(parent, `suik-consumer-${label}-`));
  const cleanup = () => rmSync(base, { recursive: true, force: true });
  t.after(cleanup);
  try {
    const root = path.join(base, "consumer");
    cpSync(source, root, {
      recursive: true,
      filter: (entry) => !COPY_EXCLUDES.has(path.basename(entry)),
    });
    // A real node_modules directory of package/bin symlinks lets the copy
    // resolve the pinned tools without duplicating installed packages. Removal
    // deletes the links, never the installed packages they point at.
    linkFixtureNodeModules(
      path.join(FIXTURE_ROOT, "node_modules"),
      path.join(root, "node_modules"),
    );
    return root;
  } catch (error) {
    cleanup();
    throw error;
  }
}

function runFixtureScript(root, script, timeout) {
  const execPath = process.env["npm_execpath"];
  const viaNode =
    execPath !== undefined &&
    existsSync(execPath) &&
    /\.[cm]?js$/.test(execPath);
  const command = viaNode ? process.execPath : "pnpm";
  const args = viaNode ? [execPath, "run", script] : ["run", script];
  const env = { ...process.env };
  delete env["NODE_OPTIONS"];
  delete env["NODE_V8_COVERAGE"];
  delete env["NODE_TEST_CONTEXT"];
  env["npm_config_verify_deps_before_run"] = "false";
  env["PATH"] =
    `${path.dirname(process.execPath)}${path.delimiter}${env["PATH"] ?? ""}`;
  const result = spawnSync(command, args, {
    cwd: root,
    env,
    encoding: "utf8",
    timeout,
  });
  return {
    status: result.status,
    signal: result.signal,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error,
  };
}

function assertCompleted(result, label) {
  assert.equal(
    result.error,
    undefined,
    `${label}: subprocess reported an error (possible timeout): ${String(result.error)}`,
  );
  assert.notEqual(
    result.status,
    null,
    `${label}: process ended via signal ${String(result.signal)}`,
  );
  return result.status;
}

let server;
let port;

before(async () => {
  assert.ok(
    existsSync(MAIN_HANDLER),
    `missing ${path.relative(PACKAGE_ROOT, MAIN_HANDLER)}; run \`pnpm run fixture:build\` first`,
  );
  // No operand: this exercises the launcher's maintained default handler path.
  server = startOwnedServer({ args: [DEFAULT_LAUNCHER] });
  port = await server.ready;
});

afterEach(() => {
  // Unexpected stderr or a post-ready exit must fail the suite even when no
  // later request happens to use the dead server.
  if (server !== undefined) server.assertAlive();
});

after(async () => {
  if (server === undefined) return;
  // Sample health after teardown drains stdio, so shutdown-time stderr and a
  // post-ready exit are both observed rather than missed.
  await server.stop();
  const healthError = server.failure();
  if (healthError) throw healthError;
});

test("the built app serves the qualification route as server-rendered HTML", async () => {
  const response = await fetchRoute(`http://127.0.0.1:${port}/`);
  assertServerRendered(response, "world");
});

test("distinct repeated and concurrent requests keep their own server value", async () => {
  const values = ["alpha", "bravo", "charlie", "delta"];

  // Repeated sequential requests for the same value stay stable.
  const repeated = await fetchRoute(`http://127.0.0.1:${port}/?name=alpha`);
  assertServerRendered(repeated, "alpha");
  const repeatedAgain = await fetchRoute(
    `http://127.0.0.1:${port}/?name=alpha`,
  );
  assertServerRendered(repeatedAgain, "alpha");

  // Concurrent requests for different values must not leak into each other.
  const responses = await Promise.all(
    values.map((value) =>
      fetchRoute(`http://127.0.0.1:${port}/?name=${encodeURIComponent(value)}`),
    ),
  );
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    const visible = assertServerRendered(responses[index], value);
    for (const other of values) {
      if (other === value) continue;
      assert.ok(
        !visible.includes(`Server value: ${other}`),
        `response for ${value} leaked the value ${other}`,
      );
    }
  }
});

test("server-rendered request values are HTML-escaped", async () => {
  const response = await fetchRoute(
    `http://127.0.0.1:${port}/?name=${encodeURIComponent("<b>injected</b>")}`,
  );
  assertHtmlTransport(response, "escaped request");
  const visible = stripScripts(response.body);
  assert.match(
    visible,
    /Consumer fixture qualification/,
    "expected the route heading in server-rendered markup",
  );
  const paragraph = visible.match(
    /<p data-testid="server-value">([\s\S]*?)<\/p>/,
  );
  assert.ok(paragraph, "expected the visible server-value paragraph");
  const rendered = paragraph[1];
  assert.ok(
    rendered.includes("&lt;b>injected&lt;/b>"),
    `expected the escaped value in visible markup: ${rendered}`,
  );
  assert.ok(
    !rendered.includes("<b>"),
    `visible markup must not contain raw injected markup: ${rendered}`,
  );
});

test("the compatibility route server-renders the Bits switch semantics", async () => {
  const response = await fetchRoute(`http://127.0.0.1:${port}/compatibility`);
  assertHtmlTransport(response, "compatibility route");
  const visible = stripScripts(response.body);
  assert.match(visible, /Compatibility qualification/);
  assert.match(visible, /role="switch"/);
  assert.match(visible, /aria-checked="false"/);
  assert.match(visible, /aria-label="Enable compatibility notifications"/);
  // The delegated element is the only switch button; the two fixture control
  // buttons are separate, so no nested buttons exist.
  assert.equal((visible.match(/<button\b/g) ?? []).length, 3);
  // Bits renders its hidden input outside the child branch as a sibling.
  assert.match(visible, /<input[^>]*name="notifications"/);
});

test("a real Svelte/TypeScript mismatch fails fixture:check and restored input passes", (t) => {
  const copy = createDisposableCopy(t, "type-mismatch");
  const pagePath = path.join(copy, "src", "routes", "+page.svelte");
  const originalPage = readFileSync(pagePath, "utf8");
  const marker = "let { data }: { data: PageData } = $props();";
  assert.ok(
    originalPage.includes(marker),
    "the maintained route must keep the typed props marker",
  );

  const mismatched = originalPage.replace(
    marker,
    `${marker}\n\n  function readServerValueAsNumber(): number {\n    return data.serverValue;\n  }`,
  );
  assert.notEqual(mismatched, originalPage, "the mismatch edit must apply");
  writeFileSync(pagePath, mismatched);

  const failing = runFixtureScript(copy, "check", CHECK_TIMEOUT_MS);
  const failingStatus = assertCompleted(failing, "fixture:check mismatch");
  assert.notEqual(
    failingStatus,
    0,
    `expected fixture:check to fail for a type mismatch\n${failing.stdout}\n${failing.stderr}`,
  );
  const failingOutput = `${failing.stdout}\n${failing.stderr}`;
  assert.match(
    failingOutput,
    /\+page\.svelte/,
    "the diagnostic must name the failing route file",
  );
  assert.match(
    failingOutput,
    /is not assignable to type 'number'/,
    "the diagnostic must be the real TypeScript assignability error",
  );

  writeFileSync(pagePath, originalPage);
  const restored = runFixtureScript(copy, "check", CHECK_TIMEOUT_MS);
  const restoredStatus = assertCompleted(restored, "fixture:check restored");
  assert.equal(
    restoredStatus,
    0,
    `restored fixture:check must pass\n${restored.stdout}\n${restored.stderr}`,
  );
});

test("disabling SSR fails only the missing-markup assertion (disposable copy)", async (t) => {
  const copy = createDisposableCopy(t, "ssr-disabled");
  writeFileSync(
    path.join(copy, "src", "routes", "+page.ts"),
    "export const ssr = false;\n",
  );

  const built = runFixtureScript(copy, "build", BUILD_TIMEOUT_MS);
  const buildStatus = assertCompleted(built, "fixture:build ssr-disabled");
  assert.equal(
    buildStatus,
    0,
    `the SSR-disabled copy must still build\n${built.stdout}\n${built.stderr}`,
  );

  const copyHandler = path.join(copy, "build", "handler.js");
  assert.ok(
    existsSync(copyHandler),
    "the disposed copy build must emit handler.js",
  );

  const disabledServer = startOwnedServer({
    args: [DEFAULT_LAUNCHER, copyHandler],
  });
  try {
    const disabledPort = await disabledServer.ready;
    const response = await fetchRoute(`http://127.0.0.1:${disabledPort}/`);
    // Transport success is asserted independently: an HTTP 500 or a wrong
    // content type must fail here rather than satisfy the missing-markup case.
    assertHtmlTransport(response, "SSR-disabled copy");
    const error = missingSsrMarkupError(response, "world");
    assert.ok(
      error,
      "a real SSR-disabled page must be missing visible server markup",
    );
    assert.match(error.message, /missing visible SSR markup/);
  } finally {
    await disabledServer.stop();
  }
});

test("a failed disposable-copy setup removes its owned directory synchronously", (t) => {
  const probeParent = mkdtempSync(
    path.join(os.tmpdir(), "suik-consumer-probe-parent-"),
  );
  t.after(() => rmSync(probeParent, { recursive: true, force: true }));

  assert.throws(
    () =>
      createDisposableCopy(t, "setup-fault", {
        source: path.join(probeParent, "does-not-exist"),
        parent: probeParent,
      }),
    /ENOENT|no such file/i,
  );
  assert.deepEqual(
    readdirSync(probeParent),
    [],
    "a failed disposable-copy setup must not leave an owned directory",
  );
});
