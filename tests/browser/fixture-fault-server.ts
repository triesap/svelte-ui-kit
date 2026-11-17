#!/usr/bin/env node
/**
 * Deterministic controlled launcher for the `startFixtureServer` ownership
 * controls. It reports the same JSON port line as the maintained launcher, but
 * deliberately misbehaves according to `SUIK_FIXTURE_FAULT`:
 *
 *   ok        report a valid port and serve 200 HTML (control)
 *   malformed write unexpected stderr, then report a non-numeric port line
 *   silent    bind the port but never report readiness
 *
 * It always writes `{ pid, port }` to `SUIK_FIXTURE_REPORT` so a test can prove
 * the owned child and listener are gone after a rejected readiness. It ignores
 * nothing on shutdown: SIGTERM closes the listener and exits.
 */
import { writeFileSync } from "node:fs";
import { createServer } from "node:http";

const fault = process.env.SUIK_FIXTURE_FAULT ?? "ok";
const report = process.env.SUIK_FIXTURE_REPORT;

const server = createServer((_request, response) => {
  response.writeHead(200, { "content-type": "text/html" });
  response.end("<html><body>ok</body></html>");
});

server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  if (address === null || typeof address === "string") {
    process.stderr.write("fixture-fault-server: no TCP address assigned\n");
    process.exit(1);
  }
  if (report) {
    writeFileSync(
      report,
      `${JSON.stringify({ pid: process.pid, port: address.port })}\n`,
    );
  }
  if (fault === "silent") return;
  if (fault === "malformed") {
    process.stderr.write("fixture-fault-server: injected stderr\n");
    process.stdout.write(`${JSON.stringify({ port: "not-a-number" })}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify({ port: address.port })}\n`);
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
