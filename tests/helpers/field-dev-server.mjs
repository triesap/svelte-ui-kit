/** Real native development compilation, isolated in the owned application. */
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { createServer as createHttpServer } from "node:http";

const root = path.dirname(path.dirname(path.resolve(process.argv[2])));
const require = createRequire(path.join(root, "package.json"));
process.chdir(root);
const { createServer } = await import(
  pathToFileURL(require.resolve("vite")).href
);
const server = await createServer({
  root,
  logLevel: "warn",
  server: { middlewareMode: true, hmr: false },
});
const http = createHttpServer(server.middlewares);
await new Promise((resolve, reject) => {
  http.once("error", reject);
  http.listen(0, "127.0.0.1", resolve);
});
const address = http.address();
if (!address || typeof address === "string")
  throw new Error("No owned dev port");
process.stdout.write(`${JSON.stringify({ port: address.port })}\n`);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, async () => {
    await server.close();
    await new Promise((resolve, reject) =>
      http.close((error) => (error ? reject(error) : resolve())),
    );
    process.exit(0);
  });
