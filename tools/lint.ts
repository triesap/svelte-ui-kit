/** Run both complementary linters and retain every failure, including launch errors. */
import { spawnSync } from "node:child_process";

let failed = false;
for (const [command, ...args] of [
  ["biome", "lint", ".", "--diagnostic-level=warn", "--error-on-warnings"],
  ["eslint", ".", "--max-warnings", "0"],
]) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) console.error(`${command}: ${String(result.error)}`);
  if (result.error || result.signal || result.status !== 0) failed = true;
}
process.exitCode = failed ? 1 : 0;
