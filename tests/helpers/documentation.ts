import { createRequire } from "node:module";
import path from "node:path";

// The typed runner emits test TS; authoring tools stay at the repository cwd.
export const documentation = createRequire(import.meta.url)(
  path.resolve("tools/check-docs.mjs"),
) as typeof import("../../tools/check-docs.mjs");
