import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import {
  consumerFixtureRoot,
  copyConsumerFixture,
  runFixtureScript,
} from "../helpers/fixture.js";

/**
 * S011 typed component-compatibility orchestration.
 *
 * The maintained fixture's fixture-only Bits `Switch.Root`/`Switch.Thumb`
 * component must type-check with the pinned versions. Disposable copies then
 * prove that incompatible `bind:checked`, `bind:ref` and `child`-snippet
 * examples fail `svelte-check` for their intended diagnostics, and that
 * restoring the source returns the copy to green. No `any` or cast is used.
 */
const PACKAGE_ROOT = process.cwd();
const FIXTURE_ROOT = consumerFixtureRoot(PACKAGE_ROOT);
const COMPONENT_REL = "src/lib/compatibility/SwitchFixture.svelte";
const COMPONENT_PATH = path.join(FIXTURE_ROOT, COMPONENT_REL);
const ORIGINAL = readFileSync(COMPONENT_PATH, "utf8");

test("the maintained Bits Switch compatibility fixture type-checks", () => {
  const result = runFixtureScript(FIXTURE_ROOT, "check");
  assert.equal(
    result.status,
    0,
    `expected the maintained compatibility fixture to type-check\n${result.stdout}\n${result.stderr}`,
  );
});

const NEGATIVES: ReadonlyArray<{
  label: string;
  mutate: (source: string) => string;
  diagnostic: RegExp;
}> = [
  {
    label: "bind:checked to a string",
    mutate: (source) =>
      source.replace(
        "let checked = $state(false);",
        'let checked = $state<string>("no");',
      ),
    diagnostic: /not assignable to type 'boolean/,
  },
  {
    label: "bind:ref to a number",
    mutate: (source) =>
      source.replace(
        "let switchRef = $state<HTMLElement | null>(null);",
        "let switchRef = $state<number>(0);",
      ),
    diagnostic: /not assignable to type 'HTMLElement/,
  },
  {
    label: "child snippet with an unknown prop",
    mutate: (source) =>
      source.replace(
        "{#snippet child({ props, checked: childChecked })}",
        "{#snippet child({ props, checked: childChecked, bogus })}",
      ),
    diagnostic: /Property 'bogus' does not exist/,
  },
  {
    label: "Switch.Thumb with an unknown prop",
    mutate: (source) =>
      source.replace(
        '<Switch.Thumb data-testid="switch-thumb" data-checked={childChecked} />',
        '<Switch.Thumb data-testid="switch-thumb" bogus={childChecked} />',
      ),
    diagnostic: /bogus|SwitchThumbProps|does not exist|not assignable/,
  },
];

for (const { label, mutate, diagnostic } of NEGATIVES) {
  test(`an incompatible ${label} example fails with its intended diagnostic`, (t) => {
    const copy = copyConsumerFixture();
    t.after(() => copy.cleanup());
    const componentPath = path.join(copy.root, COMPONENT_REL);

    const mutated = mutate(ORIGINAL);
    assert.notEqual(mutated, ORIGINAL, `${label}: mutation must apply`);
    writeFileSync(componentPath, mutated);

    const failing = runFixtureScript(copy.root, "check");
    const failingOutput = `${failing.stdout}\n${failing.stderr}`;
    assert.notEqual(
      failing.status,
      0,
      `expected svelte-check to fail for ${label}\n${failingOutput}`,
    );
    assert.match(failingOutput, diagnostic, `${label}: intended diagnostic`);
    assert.match(
      failingOutput,
      /SwitchFixture\.svelte/,
      `${label}: diagnostic must name the authored fixture component`,
    );

    writeFileSync(componentPath, ORIGINAL);
    const restored = runFixtureScript(copy.root, "check");
    assert.equal(
      restored.status,
      0,
      `restored copy must type-check again\n${restored.stdout}\n${restored.stderr}`,
    );
  });
}
