#!/usr/bin/env node
/**
 * Owned production server launcher for the S007 SSR qualification.
 *
 * The SvelteKit Node adapter emits `build/handler.js`, a plain
 * `(request, response) => void` listener. This launcher hosts a given handler
 * on an OS-assigned loopback port (never a fixed port) and prints the resolved
 * port as a single JSON line on stdout so the smoke test can connect. The
 * process stays in the foreground and shuts down on SIGTERM/SIGINT.
 *
 * Usage: node consumer-fixture-server.mjs [handler.js]
 * With no argument it loads the maintained fixture handler.
 */
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

const defaultHandler = new URL(
  "../fixtures/consumer/build/handler.js",
  import.meta.url,
);
const handlerUrl = process.argv[2]
  ? pathToFileURL(path.resolve(process.argv[2]))
  : defaultHandler;

const { handler } = await import(handlerUrl.href);
const server = createServer(handler);

server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  if (address === null || typeof address === "string") {
    process.stderr.write("consumer fixture server: no TCP address assigned\n");
    process.exit(1);
  }
  process.stdout.write(`${JSON.stringify({ port: address.port })}\n`);
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
