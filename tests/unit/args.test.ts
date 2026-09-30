import assert from "node:assert/strict";
import { test } from "node:test";

import { parseCliArgs, type CommandRequest } from "../../src/cli/args.js";

/**
 * S023 tests: only the approved grammar parses, rejected options fail before
 * any side effect, and help/version stay stable.
 */

function commandOf(argv: readonly string[]): CommandRequest {
  const request = parseCliArgs(argv);
  assert.equal(request.kind, "command", JSON.stringify(argv));
  if (request.kind !== "command") throw new Error("not a command");
  return request;
}

function usageOf(argv: readonly string[]): string {
  const request = parseCliArgs(argv);
  assert.equal(request.kind, "usage-error", JSON.stringify(argv));
  if (request.kind !== "usage-error") throw new Error("not a usage error");
  return request.message;
}

test("help and version remain stable and must be used alone", () => {
  assert.deepEqual(parseCliArgs([]), { kind: "help" });
  assert.deepEqual(parseCliArgs(["--help"]), { kind: "help" });
  assert.deepEqual(parseCliArgs(["-h"]), { kind: "help" });
  assert.deepEqual(parseCliArgs(["--version"]), { kind: "version" });
  assert.deepEqual(parseCliArgs(["-V"]), { kind: "version" });
  assert.equal(parseCliArgs(["--help", "--version"]).kind, "usage-error");
  assert.equal(parseCliArgs(["--help", "extra"]).kind, "usage-error");
});

test("approved commands parse with their options", () => {
  assert.deepEqual(commandOf(["info"]), {
    kind: "command",
    command: "info",
    item: null,
    json: false,
    cwd: null,
    dryRun: false,
    source: false,
    strict: false,
  });
  assert.equal(commandOf(["init"]).command, "init");
  assert.equal(commandOf(["sync"]).command, "sync");
  assert.equal(commandOf(["doctor"]).command, "doctor");
  assert.deepEqual(commandOf(["add", "button"]).item, "button");
  assert.deepEqual(commandOf(["view", "alert-dialog"]).item, "alert-dialog");
});

test("global options may precede or follow the command", () => {
  assert.deepEqual(commandOf(["--json", "info"]).json, true);
  assert.deepEqual(commandOf(["info", "--json"]).json, true);
  const cwdBefore = commandOf(["--cwd", "app", "add", "button"]);
  const cwdAfter = commandOf(["add", "button", "--cwd=app"]);
  assert.equal(cwdBefore.cwd, "app");
  assert.equal(cwdAfter.cwd, "app");
});

test("bare view/add, extra positionals and invalid ids are usage errors", () => {
  assert.match(usageOf(["view"]), /requires exactly one item/);
  assert.match(usageOf(["add"]), /requires exactly one item/);
  assert.match(usageOf(["add", "button", "spinner"]), /exactly one item/);
  assert.match(usageOf(["info", "extra"]), /does not accept positional/);
  assert.match(usageOf(["add", "Button"]), /invalid item id/);
  assert.match(usageOf(["view", "alert_dialog"]), /invalid item id/);
});

test("unknown commands and rejected options fail", () => {
  assert.match(usageOf(["remove", "button"]), /unknown command/);
  assert.match(usageOf(["update"]), /unknown command/);
  for (const option of [
    "--force",
    "--remove",
    "--auto-install",
    "--registry",
    "--remote",
    "-x",
  ]) {
    assert.match(usageOf(["add", "button", option]), /unsupported option/);
  }
});

test("duplicate flags and missing values fail", () => {
  assert.match(usageOf(["info", "--json", "--json"]), /duplicate --json/);
  assert.match(
    usageOf(["--cwd", "a", "--cwd", "b", "info"]),
    /duplicate --cwd/,
  );
  assert.match(usageOf(["--cwd"]), /requires a directory value/);
  assert.match(usageOf(["--cwd="]), /requires a directory value/);
  assert.match(
    usageOf(["add", "button", "--cwd", "--json"]),
    /requires a directory value/,
  );
});

test("options are scoped to their commands", () => {
  assert.match(usageOf(["info", "--dry-run"]), /--dry-run is only valid/);
  assert.match(usageOf(["doctor", "--dry-run"]), /--dry-run is only valid/);
  assert.match(
    usageOf(["add", "button", "--source"]),
    /--source is only valid/,
  );
  assert.match(
    usageOf(["view", "button", "--strict"]),
    /--strict is only valid/,
  );
  assert.deepEqual(commandOf(["add", "button", "--dry-run"]).dryRun, true);
  assert.deepEqual(commandOf(["view", "button", "--source"]).source, true);
  assert.deepEqual(commandOf(["doctor", "--strict"]).strict, true);
});

test("parsing is pure and performs no writes", () => {
  // `parseCliArgs` imports no filesystem module and returns a value only; a
  // representative parse must not throw or mutate its input.
  const argv = ["add", "button", "--json"];
  const frozen = Object.freeze([...argv]);
  const first = parseCliArgs(frozen);
  const second = parseCliArgs(frozen);
  assert.deepEqual(first, second);
  assert.deepEqual(frozen, argv);
});
