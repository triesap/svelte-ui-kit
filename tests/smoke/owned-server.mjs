/**
 * Owned loopback server lifecycle boundary for the S007/S008 smoke suites.
 *
 * The maintained SSR suite, the lifecycle fault controls and the browser
 * harness share this one implementation so the verified behaviour is the
 * behaviour under test. An owned server is a child process launched here that
 * reports its OS-assigned loopback port as a single JSON line on stdout.
 *
 * The boundary:
 *   - settles a spawn failure (missing executable, invalid cwd) instead of
 *     leaving `stop()` waiting forever;
 *   - records stderr continuously, including stderr written while an
 *     intentional SIGTERM shutdown runs, and drains stdio before `stop()`
 *     resolves;
 *   - retains the first observed failure so a later `stop()` call never
 *     erases an already observed unexpected exit or error stderr;
 *   - distinguishes an intentional `stop()` shutdown from a prior exit;
 *   - bounds startup, requests (headers and full body) and the whole
 *     termination path, including a forced SIGKILL fallback;
 *   - kills only the child it started, never an unrelated listener.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_START_TIMEOUT_MS = 30_000;
export const DEFAULT_STOP_TIMEOUT_MS = 10_000;
export const DEFAULT_KILL_GRACE_MS = 2_000;
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

/** Human-readable exit description used in diagnostics. */
function describeExit(info) {
  if (info.error) return `spawn error: ${info.error.message}`;
  return `code=${String(info.code)} signal=${String(info.signal)}`;
}

/** Resolve `promise`, or reject after `ms` so a stuck child cannot hang a test. */
function settleWithin(promise, ms) {
  let timer;
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Build the owned child environment. When NO_COLOR is present, the conflicting
 * FORCE_COLOR is removed from the child copy only; the parent environment is
 * never mutated. This prevents Node's conflicting-color warning from polluting
 * an owned child's stderr without filtering or suppressing anything.
 */
function ownedChildEnvironment(overrides) {
  const merged = { ...process.env, ...overrides };
  if (merged.NO_COLOR !== undefined) {
    delete merged.FORCE_COLOR;
  }
  return merged;
}

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
    killGraceMs = DEFAULT_KILL_GRACE_MS,
  } = options;

  // A synchronous spawn throw (invalid options) and an asynchronous `error`
  // event (missing executable, invalid cwd) are both settled into `exitInfo`
  // so `stop()` can always resolve.
  let child = null;
  let spawnError = null;
  try {
    child = spawn(command, args, {
      cwd,
      env: ownedChildEnvironment(env),
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stderr.setEncoding("utf8");
    child.stdout.setEncoding("utf8");
  } catch (error) {
    spawnError = error;
  }

  let stderr = "";
  let stdout = "";
  let exitInfo = spawnError
    ? { code: null, signal: null, error: spawnError }
    : null;
  let closed = false;
  let intentionalStop = false;
  let firstFailure = null;
  let stopPromise = null;

  let readySettled = false;
  let resolveReady;
  let rejectReady;
  const ready = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  // Startup rejection must not surface as an unhandled rejection when a caller
  // inspects `failure()` instead of awaiting `ready`.
  ready.catch(() => {});

  let resolveExited;
  const exited = new Promise((resolve) => {
    resolveExited = resolve;
  });
  let resolveClosed;
  const closePromise = new Promise((resolve) => {
    resolveClosed = resolve;
  });

  const settleReady = (fn, value) => {
    if (readySettled) return;
    readySettled = true;
    fn(value);
  };

  const recordFailure = (error) => {
    if (firstFailure === null) firstFailure = error;
  };

  const currentExitFailure = () => {
    if (exitInfo === null || intentionalStop) return null;
    return new Error(
      `owned server exited unexpectedly (${describeExit(exitInfo)})\nstderr:\n${stderr}`,
    );
  };

  const currentStderrFailure = () => {
    if (stderr.trim() === "") return null;
    return new Error(`owned server wrote unexpected stderr:\n${stderr}`);
  };

  /** The first unexpected failure observed so far, or null while healthy. */
  const failure = () => {
    if (firstFailure !== null) return firstFailure;
    const exitFailure = currentExitFailure();
    if (exitFailure !== null) {
      recordFailure(exitFailure);
      return exitFailure;
    }
    const stderrFailure = currentStderrFailure();
    if (stderrFailure !== null) {
      recordFailure(stderrFailure);
      return stderrFailure;
    }
    return null;
  };

  /** Throw with diagnostics when the server has written stderr or exited. */
  const assertAlive = () => {
    const error = failure();
    if (error) throw error;
  };

  // A synchronous spawn throw has no child events; settle immediately.
  if (spawnError !== null) {
    resolveExited(exitInfo);
    closed = true;
    resolveClosed(exitInfo);
    settleReady(rejectReady, spawnError);
  }

  const startTimer = setTimeout(() => {
    settleReady(
      rejectReady,
      new Error(
        `owned server did not report a port within ${startTimeoutMs}ms\nstderr:\n${stderr}`,
      ),
    );
  }, startTimeoutMs);
  startTimer.unref?.();

  const tryParsePort = () => {
    const newline = stdout.indexOf("\n");
    if (newline === -1) return;
    clearTimeout(startTimer);
    try {
      const parsed = JSON.parse(stdout.slice(0, newline));
      if (typeof parsed.port !== "number") {
        throw new Error("missing numeric port");
      }
      settleReady(resolveReady, parsed.port);
    } catch (error) {
      settleReady(
        rejectReady,
        new Error(
          `owned server reported an unreadable port line ${JSON.stringify(stdout)}: ${String(error)}`,
        ),
      );
    }
  };

  if (child !== null) {
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      tryParsePort();
    });

    child.once("exit", (code, signal) => {
      if (exitInfo === null) exitInfo = { code, signal };
      resolveExited(exitInfo);
      clearTimeout(startTimer);
      settleReady(
        rejectReady,
        new Error(
          `owned server exited before reporting a port (${describeExit(exitInfo)})\nstderr:\n${stderr}`,
        ),
      );
    });
    // `close` fires after the stdio streams are drained, so stopping on it
    // guarantees any shutdown-time stderr has been captured.
    child.once("close", (code, signal) => {
      if (exitInfo === null) exitInfo = { code, signal };
      closed = true;
      resolveExited(exitInfo);
      resolveClosed(exitInfo);
    });
    child.once("error", (error) => {
      if (exitInfo === null) {
        exitInfo = { code: null, signal: null, error };
      }
      closed = true;
      resolveExited(exitInfo);
      resolveClosed(exitInfo);
      clearTimeout(startTimer);
      settleReady(rejectReady, error);
    });
  }

  /**
   * Stop the owned child: SIGTERM, a bounded wait, then SIGKILL. The whole
   * termination path is bounded; a child that survives SIGKILL is recorded as
   * a teardown failure rather than hanging the caller. Once a failure has been
   * observed, `stop()` never erases it.
   */
  const stop = () => {
    if (stopPromise !== null) return stopPromise;
    stopPromise = (async () => {
      const alreadyExited = exitInfo !== null;
      if (!alreadyExited) {
        intentionalStop = true;
        try {
          child.kill("SIGTERM");
        } catch {
          // The process may already be gone; the close wait below decides.
        }
        const killTimer = setTimeout(() => {
          if (exitInfo === null) {
            try {
              child.kill("SIGKILL");
            } catch {
              // Nothing else can be signalled.
            }
          }
        }, stopTimeoutMs);
        killTimer.unref?.();
        try {
          await settleWithin(closePromise, stopTimeoutMs + killGraceMs);
        } catch (error) {
          recordFailure(
            new Error(
              `owned server teardown did not complete: ${error.message}\nstderr:\n${stderr}`,
            ),
          );
        }
        clearTimeout(killTimer);
      } else {
        try {
          await settleWithin(closePromise, stopTimeoutMs + killGraceMs);
        } catch (error) {
          recordFailure(
            new Error(
              `owned server teardown did not complete: ${error.message}\nstderr:\n${stderr}`,
            ),
          );
        }
      }
      return exitInfo;
    })();
    return stopPromise;
  };

  return {
    child,
    ready,
    exited,
    closed: closePromise,
    stop,
    stderr: () => stderr,
    stdout: () => stdout,
    failure,
    assertAlive,
    isClosed: () => closed,
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
