/**
 * Owned loopback server lifecycle boundary for the S007/S008 smoke suites.
 *
 * The maintained SSR suite and the lifecycle fault controls share this one
 * implementation so the verified behaviour is the behaviour under test. An
 * owned server is a child process launched here that reports its OS-assigned
 * loopback port as a single JSON line on stdout.
 *
 * The boundary:
 *   - records stderr continuously, including after readiness;
 *   - records the exit event even after readiness and distinguishes an
 *     intentional `stop()` shutdown from an unexpected exit;
 *   - bounds startup, requests (headers and full body) and teardown;
 *   - kills only the child it started, never an unrelated listener.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_START_TIMEOUT_MS = 30_000;
export const DEFAULT_STOP_TIMEOUT_MS = 10_000;
export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

/** The maintained production-server launcher for the consumer fixture. */
export const DEFAULT_LAUNCHER = path.join(HERE, "consumer-fixture-server.mjs");
/** The maintained fixture's adapter output, relative to this module. */
export const DEFAULT_HANDLER = path.join(
  HERE,
  "..",
  "fixtures",
  "consumer",
  "build",
  "handler.js",
);

/**
 * Start an owned child server. Returns a handle whose `ready` promise resolves
 * to the assigned port. The caller owns the handle and must `stop()` it.
 */
export function startOwnedServer(options = {}) {
  const {
    command = process.execPath,
    args = [DEFAULT_LAUNCHER],
    cwd = process.cwd(),
    env = {},
    startTimeoutMs = DEFAULT_START_TIMEOUT_MS,
    stopTimeoutMs = DEFAULT_STOP_TIMEOUT_MS,
  } = options;

  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  let stdout = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });

  let exitInfo = null;
  let settleExit;
  const exited = new Promise((resolve) => {
    settleExit = resolve;
  });

  let readyResolve;
  let readyReject;
  const ready = new Promise((resolve, reject) => {
    readyResolve = resolve;
    readyReject = reject;
  });
  // Startup rejection must not surface as an unhandled rejection when a caller
  // inspects `failure()` instead of awaiting `ready`.
  ready.catch(() => {});

  let settled = false;
  const settle = (fn, value) => {
    if (settled) return;
    settled = true;
    fn(value);
  };

  const startTimer = setTimeout(() => {
    settle(
      readyReject,
      new Error(
        `owned server did not report a port within ${startTimeoutMs}ms\nstderr:\n${stderr}`,
      ),
    );
  }, startTimeoutMs);

  const tryParsePort = () => {
    const newline = stdout.indexOf("\n");
    if (newline === -1) return;
    clearTimeout(startTimer);
    try {
      const parsed = JSON.parse(stdout.slice(0, newline));
      if (typeof parsed.port !== "number") {
        throw new Error("missing numeric port");
      }
      settle(readyResolve, parsed.port);
    } catch (error) {
      settle(
        readyReject,
        new Error(
          `owned server reported an unreadable port line ${JSON.stringify(stdout)}: ${String(error)}`,
        ),
      );
    }
  };
  child.stdout.on("data", tryParsePort);

  child.once("exit", (code, signal) => {
    exitInfo = { code, signal };
    settleExit(exitInfo);
    clearTimeout(startTimer);
    settle(
      readyReject,
      new Error(
        `owned server exited before reporting a port (code=${String(code)} signal=${String(signal)})\nstderr:\n${stderr}`,
      ),
    );
  });
  child.once("error", (error) => {
    clearTimeout(startTimer);
    settle(readyReject, error);
  });

  let intentionalStop = false;

  /** A description of the first unexpected failure, or null while healthy. */
  const failure = () => {
    if (exitInfo !== null && !intentionalStop) {
      return new Error(
        `owned server exited unexpectedly (code=${String(exitInfo.code)} signal=${String(exitInfo.signal)})\nstderr:\n${stderr}`,
      );
    }
    if (stderr.trim() !== "") {
      return new Error(`owned server wrote unexpected stderr:\n${stderr}`);
    }
    return null;
  };

  /** Throw with diagnostics when the server has written stderr or exited. */
  const assertAlive = () => {
    const error = failure();
    if (error) throw error;
  };

  /** Stop the owned child: SIGTERM, bounded wait, then SIGKILL. */
  const stop = async () => {
    intentionalStop = true;
    if (exitInfo !== null) return exitInfo;
    child.kill("SIGTERM");
    const killTimer = setTimeout(() => {
      if (exitInfo === null) child.kill("SIGKILL");
    }, stopTimeoutMs);
    const info = await exited;
    clearTimeout(killTimer);
    return info;
  };

  return {
    child,
    ready,
    exited,
    stop,
    stderr: () => stderr,
    stdout: () => stdout,
    failure,
    assertAlive,
  };
}

/**
 * Fetch a route with one deadline covering the response headers and the full
 * body. `fetch` resolves on headers and `text()` drains the body, so a single
 * AbortController bounds both phases; the thrown diagnostic names the phase
 * that stalled.
 */
export async function fetchRoute(url, options = {}) {
  const {
    headers = { accept: "text/html" },
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  } = options;
  const controller = new AbortController();
  const started = Date.now();
  let headersReceived = false;
  const timer = setTimeout(() => {
    controller.abort(new Error(`request deadline of ${timeoutMs}ms exceeded`));
  }, timeoutMs);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    headersReceived = true;
    const body = await response.text();
    return {
      status: response.status,
      contentType: response.headers.get("content-type") ?? "",
      body,
    };
  } catch (error) {
    const phase = headersReceived ? "response body" : "response headers";
    throw new Error(
      `request to ${url} failed during ${phase} after ${Date.now() - started}ms: ${error?.message ?? error}`,
      { cause: error },
    );
  } finally {
    clearTimeout(timer);
  }
}
