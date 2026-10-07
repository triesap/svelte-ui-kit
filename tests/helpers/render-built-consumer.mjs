/** Bounded owned production SSR; never substitute template text for rendering. */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  startOwnedServer,
  fetchRoute,
  DEFAULT_LAUNCHER,
} from "../smoke/owned-server.mjs";

const [handler, route] = process.argv.slice(2);
if (!handler || !route?.startsWith("/"))
  throw new Error("Expected an owned production handler and absolute route.");
const server = startOwnedServer({ args: [DEFAULT_LAUNCHER, handler] });
let response;
try {
  const port = await server.ready;
  response = await fetchRoute(`http://127.0.0.1:${port}${route}`);
} finally {
  await server.stop();
}
if (server.failure()) throw server.failure();
console.log(
  JSON.stringify({
    ...response,
    handlerSha256: createHash("sha256")
      .update(readFileSync(handler))
      .digest("hex"),
  }),
);
