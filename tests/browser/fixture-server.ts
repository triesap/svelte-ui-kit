import { DEFAULT_LAUNCHER, startOwnedServer } from "../smoke/owned-server.mjs";

/**
 * Shared owned-server startup for the S008 browser specs. The harness and its
 * fault control both host the real Node-adapter production handler on an
 * OS-assigned loopback port.
 */
export type OwnedServer = ReturnType<typeof startOwnedServer>;

export interface FixtureServer {
  readonly server: OwnedServer;
  readonly baseURL: string;
}

export async function startFixtureServer(): Promise<FixtureServer> {
  const server = startOwnedServer({ args: [DEFAULT_LAUNCHER] });
  const port = await server.ready;
  return { server, baseURL: `http://127.0.0.1:${port}/` };
}
