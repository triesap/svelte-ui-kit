import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ESLint } from "eslint";

test("native Anchor resolution scope retains application navigation and accessibility enforcement", async () => {
  const eslint = new ESLint({ cwd: process.cwd() });
  const messages = async (body: string, filePath: string) => {
    const [result] = await eslint.lintText(body, { filePath });
    assert.ok(result);
    return result.messages;
  };
  assert.deepEqual(
    await messages(
      readFileSync("registry/ui/anchor.svelte", "utf8"),
      "registry/ui/anchor.svelte",
    ),
    [],
  );
  const app = "tests/fixtures/qualification/anchor-lint-control/+page.svelte";
  assert.ok(
    (await messages('<a href="/unresolved">Next</a>', app)).some(
      (message) => message.ruleId === "svelte/no-navigation-without-resolve",
    ),
  );
  assert.deepEqual(
    await messages(
      '<script lang="ts">import { resolve } from "$app/paths";</script><a href={resolve("/qualification/tokens")}>Next</a>',
      app,
    ),
    [],
  );
  assert.ok(
    (
      await messages(
        '<script lang="ts">import { goto } from "$app/navigation";</script><button onclick={() => goto("/unresolved")}>Go</button>',
        "registry/ui/anchor.svelte",
      )
    ).some(
      (message) => message.ruleId === "svelte/no-navigation-without-resolve",
    ),
  );
  assert.ok(
    (
      await messages(
        '<a href="/example"><img src="/example.png" /></a>',
        "registry/ui/anchor.svelte",
      )
    ).some(
      (message) =>
        message.ruleId === "svelte/valid-compile" &&
        message.message.includes("a11y_missing_attribute"),
    ),
  );
});
