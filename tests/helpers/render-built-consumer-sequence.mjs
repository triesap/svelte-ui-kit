/** Concurrent and repeated requests share one owned production worker. */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  startOwnedServer,
  fetchRoute,
  DEFAULT_LAUNCHER,
} from "../smoke/owned-server.mjs";

const [handler, ...routes] = process.argv.slice(2);
if (
  !handler ||
  !routes.length ||
  routes.some((route) => !route.startsWith("/"))
)
  throw new Error("Expected a handler and absolute request routes.");
const server = startOwnedServer({ args: [DEFAULT_LAUNCHER, handler] });
let concurrent, repeated;
try {
  const port = await server.ready;
  const fetch = (route) => fetchRoute(`http://127.0.0.1:${port}${route}`);
  concurrent = await Promise.all(routes.map(fetch));
  repeated = [];
  for (const route of routes) repeated.push(await fetch(route));
} finally {
  await server.stop();
}
if (server.failure()) throw server.failure();
console.log(
  JSON.stringify({
    handlerSha256: createHash("sha256")
      .update(readFileSync(handler))
      .digest("hex"),
    routes,
    concurrent,
    repeated,
  }),
);
