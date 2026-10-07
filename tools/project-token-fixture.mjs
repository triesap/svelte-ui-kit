import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const outputs = [
  [
    "registry/styles/tokens.css",
    "tests/fixtures/consumer/src/lib/qualification/tokens/tokens.css",
  ],
  [
    "registry/contracts/component-customization-v1.json",
    "tests/fixtures/consumer/src/lib/qualification/tokens/component-customization-v1.json",
  ],
];
if (
  process.argv.length !== 3 ||
  !["--check", "--generate"].includes(process.argv[2])
)
  throw new Error("Use --check or --generate.");
for (const [source, destination] of outputs) {
  const bytes = readFileSync(path.join(root, source));
  const target = path.join(root, destination);
  if (process.argv[2] === "--generate") {
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, bytes);
  } else if (!readFileSync(target).equals(bytes))
    throw new Error(`Stale token fixture projection: ${destination}`);
}
console.log(
  `token fixture ${process.argv[2]}: ${outputs.length} exact asset projections`,
);
