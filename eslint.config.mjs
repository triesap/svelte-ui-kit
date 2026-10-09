import js from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * Flat ESLint configuration for the svelte-ui-kit authoring tree.
 *
 * It combines the JavaScript, TypeScript and Svelte recommended presets with
 * the Prettier conflict presets, parses TypeScript inside Svelte `<script>`
 * blocks, and scopes Node/browser globals to their real authoring contexts.
 * Compiler-level Svelte diagnostics (including accessibility warnings) are
 * surfaced through `svelte/valid-compile`; `pnpm run typecheck` remains the
 * separate compiler typecheck. See `CONTRIBUTING.md` for the owner commands.
 */
export default tseslint.config(
  {
    ignores: [
      // Reserved dependency/output trees are excluded at every depth. A bare
      // `dist/` only matches the configuration root, so nested generated
      // output under future consumer fixtures would otherwise be linted.
      "**/node_modules/",
      "**/.pnpm-store/",
      "**/.native-build/",
      "**/dist/",
      "**/build/",
      "**/.svelte-kit/",
      "**/coverage/",
      "**/.unit-test-build/",
      "**/.output/",
      "**/playwright-report/",
      // Explicitly rooted authoring boundaries and the ignored log tree.
      "tests/fixtures/generated/",
      "implementation/evidence/logs/",
      "**/*.log",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs.recommended,
  {
    // Surface Svelte compiler and accessibility diagnostics as lint errors.
    rules: {
      "svelte/valid-compile": "error",
    },
  },
  prettier,
  ...svelte.configs.prettier,
  {
    // Parse the TypeScript inside `<script lang="ts">` with the actual parser.
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    // Node globals belong to the CLI, tooling, tests and configuration only.
    files: [
      "*.mjs",
      "*.config.*",
      "src/cli/**/*.ts",
      "src/project/**/*.ts",
      "src/registry/**/*.ts",
      "src/codegen/**/*.ts",
      "tools/**/*.mjs",
      "tests/**/*.mjs",
      "tests/**/*.ts",
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // Anchor forwards already-resolved/native URLs. Application code owns
    // SvelteKit resolve(); resolving again here would alter caller navigation.
    // Retain goto/pushState/replaceState checks and every compiler/a11y rule.
    files: ["registry/ui/anchor.svelte"],
    rules: {
      "svelte/no-navigation-without-resolve": ["error", { ignoreLinks: true }],
    },
  },
  {
    // Browser globals are scoped to Svelte/client authoring contexts.
    files: [
      "**/*.svelte",
      "registry/**/*.ts",
      "src/lib/**/*.ts",
      "tests/fixtures/consumer/**/*.ts",
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
);
