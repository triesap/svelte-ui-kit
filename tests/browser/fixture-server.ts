import { DEFAULT_LAUNCHER, startOwnedServer } from "../smoke/owned-server.mjs";

/**
 * Shared owned-server startup for the S008 browser specs. The harness and its
 * fault control both host the real Node-adapter production handler on an
 * OS-assigned loopback port.
 *
 * The helper retains ownership of the child from the moment it is spawned. If
 * readiness is rejected — a malformed port line, a bounded readiness timeout,
 * an early exit or a spawn failure — the owned child is stopped and drained
 * before the original diagnostic is rethrown. Any cleanup or observed failure
 * is retained on the thrown `AggregateError` so it is never silently dropped.
 */
export type OwnedServer = ReturnType<typeof startOwnedServer>;

export interface FixtureServer {
  readonly server: OwnedServer;
  readonly baseURL: string;
}

export interface FixtureServerOptions {
  /** Host an actual owned generated consumer instead of the maintained build. */
  handler?: string;
  /** Override the launcher script (a narrow test-only seam). */
  launcher?: string;
  /** Override the child command, for a real spawn-failure control. */
  command?: string;
  /** Extra child environment entries, merged over the parent environment. */
  env?: Record<string, string>;
  startTimeoutMs?: number;
  stopTimeoutMs?: number;
}

export async function startFixtureServer(
  options: FixtureServerOptions = {},
): Promise<FixtureServer> {
  const server = startOwnedServer({
    command: options.command,
    args: [
      options.launcher ?? DEFAULT_LAUNCHER,
      ...(options.handler ? [options.handler] : []),
    ],
    env: options.env,
    startTimeoutMs: options.startTimeoutMs,
    stopTimeoutMs: options.stopTimeoutMs,
  });
  try {
    const port = await server.ready;
    return { server, baseURL: `http://127.0.0.1:${port}/` };
  } catch (error) {
    let cleanupError: unknown = null;
    try {
      await server.stop();
    } catch (stopError) {
      cleanupError = stopError;
    }
    const observedFailure = server.failure();
    if (cleanupError !== null || observedFailure !== null) {
      throw new AggregateError(
        [error, cleanupError ?? observedFailure],
        error instanceof Error ? error.message : String(error),
        { cause: error },
      );
    }
    throw error;
  }
}
