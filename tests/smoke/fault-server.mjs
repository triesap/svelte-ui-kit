#!/usr/bin/env node
/**
 * Deterministic fault-injection launcher for the owned-server lifecycle tests.
 *
 * It reports an OS-assigned port with the same JSON line as the maintained
 * launcher, then behaves according to `SUIK_FAULT`. It is test-only and is
 * never used by the maintained SSR suite. Every fault is deterministic; the
 * lifecycle tests observe the child's actual events rather than sleeping.
 *
 * Faults:
 *   ok              respond 200 HTML (control)
 *   startup-failure write stderr and exit 1 before reporting a port
 *   stderr          write stderr once, then serve normally
 *   stderr-on-term  write stderr while handling SIGTERM, then exit 0
 *   ignore-term     ignore SIGTERM; the harness must force SIGKILL
 *   exit-after-ready serve one request, then exit 17
 *   stall-headers   accept the request and never send headers
 *   stall-body      send headers and a partial body, then never end
 *   serve-500       respond 500 with an HTML content type
 *   serve-plain     respond 200 with a text/plain content type
 */
import { createServer } from "node:http";

const fault = process.env.SUIK_FAULT ?? "ok";

if (fault === "startup-failure") {
  process.stderr.write("fault-server: intentional startup failure\n");
  process.exit(1);
}

function handler(_request, response) {
  switch (fault) {
    case "stall-headers":
      return; // never respond
    case "stall-body":
      response.writeHead(200, { "content-type": "text/html" });
      response.write("<html><body>partial");
      return; // never end the response
    case "stderr":
      process.stderr.write("fault-server: injected stderr\n");
      break;
    case "exit-after-ready":
      response.writeHead(200, { "content-type": "text/html" });
      response.end("<html><body>one</body></html>");
      setImmediate(() => process.exit(17));
      return;
    case "serve-500":
      response.writeHead(500, { "content-type": "text/html" });
      response.end("<html><body>server error</body></html>");
      return;
    case "serve-plain":
      response.writeHead(200, { "content-type": "text/plain" });
      response.end("not html");
      return;
    default:
      break;
  }
  response.writeHead(200, { "content-type": "text/html" });
  response.end("<html><body>ok</body></html>");
}

const server = createServer(handler);
server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  if (address === null || typeof address === "string") {
    process.stderr.write("fault-server: no TCP address assigned\n");
    process.exit(1);
  }
  process.stdout.write(`${JSON.stringify({ port: address.port })}\n`);
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    // A fault that proves shutdown-time stderr is captured and reported.
    if (fault === "stderr-on-term") {
      process.stderr.write("fault-server: stderr during shutdown\n");
      server.close(() => process.exit(0));
      return;
    }
    // A fault that only SIGKILL can terminate, exercising forced shutdown.
    if (fault === "ignore-term" && signal === "SIGTERM") return;
    server.close(() => process.exit(0));
  });
}
