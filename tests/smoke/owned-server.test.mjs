#!/usr/bin/env node
/**
 * S007 owned-server lifecycle and negative-control suite.
 *
 * `pnpm run test:fixture` runs this after building the maintained fixture. It
 * exercises the shared owned-server boundary with deterministic fault
 * launchers: startup failure, error stderr, post-ready exit, stalled headers,
 * stalled body, and assertion/setup failure. It also proves the HTTP-transport
 * assertions reject an HTTP 500 or a wrong content type, and that the launcher
 * resolves both its default and an explicit handler operand.
 */
import { strict as assert } from "node:assert";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import {
  DEFAULT_HANDLER,
  DEFAULT_LAUNCHER,
  fetchRoute,
  startOwnedServer,
} from "./owned-server.mjs";
import { assertHtmlTransport } from "./ssr-assertions.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FAULT_SERVER = path.join(HERE, "fault-server.mjs");
const FAULT_STOP_TIMEOUT_MS = 2_000;
const STALL_TIMEOUT_MS = 400;

function startFault(fault) {
  return startOwnedServer({
    args: [FAULT_SERVER],
    env: { SUIK_FAULT: fault },
    stopTimeoutMs: FAULT_STOP_TIMEOUT_MS,
  });
}

test("the launcher resolves its corrected default handler path", async () => {
  assert.ok(
    existsSync(DEFAULT_HANDLER),
    `missing ${DEFAULT_HANDLER}; run \`pnpm run fixture:build\` first`,
  );
  const server = startOwnedServer();
  try {
    const port = await server.ready;
    const response = await fetchRoute(`http://127.0.0.1:${port}/`);
    assertHtmlTransport(response, "default launcher");
    assert.equal(server.failure(), null);
  } finally {
    await server.stop();
  }
});

test("the launcher accepts an explicit handler operand", async () => {
  assert.ok(existsSync(DEFAULT_HANDLER), "run `pnpm run fixture:build` first");
  const server = startOwnedServer({
    args: [DEFAULT_LAUNCHER, DEFAULT_HANDLER],
  });
  try {
    const port = await server.ready;
    const response = await fetchRoute(`http://127.0.0.1:${port}/`);
    assertHtmlTransport(response, "explicit launcher");
    assert.equal(server.failure(), null);
  } finally {
    await server.stop();
  }
});

test("a startup failure rejects readiness with the captured stderr", async () => {
  const server = startFault("startup-failure");
  try {
    await assert.rejects(server.ready, /intentional startup failure/);
    const failure = server.failure();
    assert.ok(failure, "the startup failure must be observable");
    assert.match(failure.message, /exited unexpectedly|startup failure/);
  } finally {
    await server.stop();
  }
});

test("unexpected server stderr fails the health check", async () => {
  const server = startFault("stderr");
  try {
    const port = await server.ready;
    await fetchRoute(`http://127.0.0.1:${port}/`);
    const failure = server.failure();
    assert.ok(failure, "stderr after readiness must be an observable failure");
    assert.match(failure.message, /unexpected stderr/);
    assert.throws(() => server.assertAlive(), /unexpected stderr/);
  } finally {
    await server.stop();
  }
});

test("a post-ready exit with code 17 fails the suite at teardown", async () => {
  const server = startFault("exit-after-ready");
  try {
    const port = await server.ready;
    await fetchRoute(`http://127.0.0.1:${port}/`);
    const exit = await server.exited;
    assert.equal(exit.code, 17, "the fault launcher must exit 17");
    assert.throws(() => server.assertAlive(), /exited unexpectedly \(code=17/);
  } finally {
    await server.stop();
  }
});

test("stalled response headers hit the request deadline", async () => {
  const server = startFault("stall-headers");
  try {
    const port = await server.ready;
    await assert.rejects(
      fetchRoute(`http://127.0.0.1:${port}/`, { timeoutMs: STALL_TIMEOUT_MS }),
      /failed during response headers/,
    );
  } finally {
    await server.stop();
  }
});

test("a stalled response body hits the request deadline", async () => {
  const server = startFault("stall-body");
  try {
    const port = await server.ready;
    await assert.rejects(
      fetchRoute(`http://127.0.0.1:${port}/`, { timeoutMs: STALL_TIMEOUT_MS }),
      /failed during response body/,
    );
  } finally {
    await server.stop();
  }
});

test("an HTTP 500 response is rejected by the transport assertion", async () => {
  const server = startFault("serve-500");
  try {
    const port = await server.ready;
    const response = await fetchRoute(`http://127.0.0.1:${port}/`);
    assert.equal(response.status, 500);
    assert.throws(
      () => assertHtmlTransport(response, "probe"),
      /expected HTTP 200/,
    );
  } finally {
    await server.stop();
  }
});

test("a wrong content type is rejected by the transport assertion", async () => {
  const server = startFault("serve-plain");
  try {
    const port = await server.ready;
    const response = await fetchRoute(`http://127.0.0.1:${port}/`);
    assert.equal(response.status, 200);
    assert.match(response.contentType, /text\/plain/);
    assert.throws(
      () => assertHtmlTransport(response, "probe"),
      /expected an HTML content type/,
    );
  } finally {
    await server.stop();
  }
});

test("an assertion failure after startup still stops the owned server", async () => {
  const server = startFault("ok");
  await server.ready;
  try {
    assert.fail("intentional assertion failure");
  } catch (error) {
    assert.match(String(error.message), /intentional assertion failure/);
  } finally {
    const info = await server.stop();
    assert.notEqual(info, null, "stop must observe the owned exit");
  }
  assert.equal(server.failure(), null, "an intentional stop is not a failure");
});

test("a missing executable settles readiness and stop instead of hanging", async () => {
  const server = startOwnedServer({
    command: path.join(HERE, "no-such-executable"),
    args: [],
    stopTimeoutMs: 500,
  });
  await assert.rejects(server.ready, /ENOENT|spawn/i);
  const failure = server.failure();
  assert.ok(failure, "a spawn failure must be observable");
  assert.match(failure.message, /spawn error|ENOENT/i);
  const info = await server.stop();
  assert.notEqual(info, null, "stop must resolve after a spawn failure");
  assert.equal(server.isClosed(), true);
});

test("an invalid working directory settles readiness and stop", async () => {
  const server = startOwnedServer({
    cwd: path.join(HERE, "no-such-directory"),
    stopTimeoutMs: 500,
  });
  await assert.rejects(server.ready, /ENOENT|spawn/i);
  const info = await server.stop();
  assert.notEqual(info, null, "stop must resolve after an invalid cwd");
  assert.ok(server.failure(), "the invalid cwd must be an observable failure");
});

test("stderr written during an intentional shutdown is observed after teardown", async () => {
  const server = startFault("stderr-on-term");
  const port = await server.ready;
  await fetchRoute(`http://127.0.0.1:${port}/`);
  assert.equal(server.failure(), null, "healthy before shutdown");
  await server.stop();
  // The stderr only arrives while SIGTERM is handled; teardown must drain it.
  const failure = server.failure();
  assert.ok(failure, "shutdown-time stderr must be a failure");
  assert.match(failure.message, /unexpected stderr/);
  assert.throws(() => server.assertAlive(), /unexpected stderr/);
});

test("stop does not erase an already observed unexpected exit", async () => {
  const server = startFault("exit-after-ready");
  const port = await server.ready;
  await fetchRoute(`http://127.0.0.1:${port}/`);
  const exit = await server.exited;
  assert.equal(exit.code, 17);
  await server.stop();
  const failure = server.failure();
  assert.ok(failure, "the earlier unexpected exit must be retained");
  assert.match(failure.message, /exited unexpectedly \(code=17/);
});

test("a server that ignores SIGTERM is force-terminated within the bound", async () => {
  const server = startFault("ignore-term");
  const port = await server.ready;
  await fetchRoute(`http://127.0.0.1:${port}/`);
  const started = Date.now();
  const info = await server.stop();
  const elapsed = Date.now() - started;
  assert.ok(info, "stop must observe the forced exit");
  assert.equal(
    info.signal,
    "SIGKILL",
    "SIGKILL must have terminated the child",
  );
  assert.ok(elapsed < 10_000, `forced termination took ${elapsed}ms`);
  assert.equal(server.failure(), null, "forced termination is intentional");
});

test("stop is idempotent and returns the same exit result", async () => {
  const server = startFault("ok");
  await server.ready;
  const first = await server.stop();
  const second = await server.stop();
  assert.equal(first, second, "repeated stop calls reuse the first result");
  assert.equal(server.failure(), null);
});
