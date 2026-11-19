import { createHash } from "node:crypto";
import path from "node:path";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  cacheDir: process.env.EXTBUILD_NODE_CACHE_DIR
    ? path.join(
        process.env.EXTBUILD_NODE_CACHE_DIR,
        "vite",
        createHash("sha256").update(process.cwd()).digest("hex").slice(0, 12),
      )
    : undefined,
  plugins: [sveltekit()],
});
