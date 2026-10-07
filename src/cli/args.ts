/**
 * Approved CLI argument grammar (S023).
 *
 * Only the reviewed surface is parsed, before any side effect:
 *
 * - commands `info`, `init`, `view`, `add`, `sync`, `doctor`;
 * - `view`/`add` take exactly one item; a bare `view`/`add` is a usage error;
 * - global `--json` and `--cwd <path>` may precede or follow the command;
 * - `--dry-run` belongs only to `init`/`add`/`sync`, `--source` only to `view`
 *   and `--strict` only to `doctor`;
 * - duplicate flags, unknown flags, missing values, extra positionals and
 *   invalid item ids are usage errors.
 *
 * Bare help/version remain stable; S078 also permits JSON help using only
 * the existing `--json` and `--help`/`-h` flags. Version remains valid alone.
 * Rejected force/remove/auto-install/remote-registry options fail explicitly
 * rather than being quietly accepted.
 *
 * JSON intent and command attribution are classified once, lexically, over the
 * *complete* argument list (`classifyArgvIntent`). A usage error therefore
 * still records whether `--json` was requested anywhere and which recognized
 * product command was present, even when the error occurs before that token is
 * reached. An absent or unknown command is attributed to the existing `help`
 * surface. Option-value boundaries are respected: `--cwd=--json` is a
 * directory value, a separate `--json` after `--cwd` still expresses JSON
 * intent under the grammar, and a directory value `info` is not the command.
 */
import { isItemId } from "../project/requests.js";

export const PRODUCT_COMMANDS = [
  "info",
  "init",
  "view",
  "add",
  "sync",
  "doctor",
] as const;
export type ProductCommand = (typeof PRODUCT_COMMANDS)[number];

export interface CommandRequest {
  readonly kind: "command";
  readonly command: ProductCommand;
  readonly item: string | null;
  readonly json: boolean;
  readonly cwd: string | null;
  readonly dryRun: boolean;
  readonly source: boolean;
  readonly strict: boolean;
}

export type CliRequest =
  | { readonly kind: "help"; readonly json?: true }
  | { readonly kind: "version" }
  | CommandRequest
  | {
      readonly kind: "usage-error";
      readonly message: string;
      readonly argv: readonly string[];
      readonly json: boolean;
      readonly command: ProductCommand | "help";
    };

/** Lexical JSON intent and command attribution for one argument list. */
export interface ArgvIntent {
  readonly json: boolean;
  readonly command: ProductCommand | "help";
}

function isProductCommand(value: string | null): value is ProductCommand {
  return (
    value !== null && (PRODUCT_COMMANDS as readonly string[]).includes(value)
  );
}

/**
 * Classify JSON intent and command attribution over the complete `argv`
 * without executing anything, swallowing nothing and respecting option-value
 * boundaries. The first non-option token that is not consumed as a `--cwd`
 * value is the command candidate; a recognized product command is attributed
 * to it, and anything else (absent or unknown) falls back to `help`.
 */
export function classifyArgvIntent(argv: readonly string[]): ArgvIntent {
  let json = false;
  let command: ProductCommand | "help" = "help";
  let found = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg === "--cwd") {
      const value = argv[index + 1];
      // Under the grammar a flag-like token is not a valid directory value, so
      // it must still be inspected on the next iteration (it may carry JSON
      // intent); a plain token is consumed as the value and is not a command.
      if (value !== undefined && !value.startsWith("-")) index += 1;
      continue;
    }
    if (arg.startsWith("--cwd=") || arg.startsWith("-")) continue;
    if (!found) {
      found = true;
      command = isProductCommand(arg) ? arg : "help";
    }
  }

  return { json, command };
}

/** Classify `argv` (already sliced past the executable/script). */
export function parseCliArgs(argv: readonly string[]): CliRequest {
  if (argv.length === 0) return { kind: "help" };
  if (
    argv.length === 2 &&
    argv.includes("--json") &&
    (argv.includes("--help") || argv.includes("-h"))
  ) {
    return { kind: "help", json: true };
  }
  const first = argv[0];
  if (argv.length === 1 && (first === "--help" || first === "-h")) {
    return { kind: "help" };
  }
  if (argv.length === 1 && (first === "--version" || first === "-V")) {
    return { kind: "version" };
  }

  const intent = classifyArgvIntent(argv);
  const usage = (message: string): CliRequest => ({
    kind: "usage-error",
    message,
    argv: [...argv],
    json: intent.json,
    command: intent.command,
  });

  let command: string | null = null;
  const positionals: string[] = [];
  const seen = new Set<string>();
  let cwd: string | null = null;
  let dryRun = false;
  let source = false;
  let strict = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (
      arg === "--help" ||
      arg === "-h" ||
      arg === "--version" ||
      arg === "-V"
    ) {
      return usage(`${arg} must be used alone`);
    }
    if (arg === "--json") {
      if (seen.has("json")) return usage("duplicate --json");
      seen.add("json");
      continue;
    }
    if (arg === "--dry-run") {
      if (seen.has("dry-run")) return usage("duplicate --dry-run");
      seen.add("dry-run");
      dryRun = true;
      continue;
    }
    if (arg === "--source") {
      if (seen.has("source")) return usage("duplicate --source");
      seen.add("source");
      source = true;
      continue;
    }
    if (arg === "--strict") {
      if (seen.has("strict")) return usage("duplicate --strict");
      seen.add("strict");
      strict = true;
      continue;
    }
    if (arg === "--cwd") {
      if (seen.has("cwd")) return usage("duplicate --cwd");
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("-")) {
        return usage("--cwd requires a directory value");
      }
      seen.add("cwd");
      cwd = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--cwd=")) {
      if (seen.has("cwd")) return usage("duplicate --cwd");
      const value = arg.slice("--cwd=".length);
      if (value === "") return usage("--cwd requires a directory value");
      seen.add("cwd");
      cwd = value;
      continue;
    }
    if (arg.startsWith("-")) {
      return usage(`unsupported option: ${arg}`);
    }
    if (command === null) command = arg;
    else positionals.push(arg);
  }

  if (command === null) {
    return usage("no command was given");
  }
  if (!isProductCommand(command)) {
    return usage(`unknown command: ${command}`);
  }

  const takesItem = command === "view" || command === "add";
  if (takesItem) {
    if (positionals.length === 0) {
      return usage(`"${command}" requires exactly one item`);
    }
    if (positionals.length > 1) {
      return usage(`"${command}" accepts exactly one item`);
    }
    if (!isItemId(positionals[0])) {
      return usage(`invalid item id: ${positionals[0]}`);
    }
  } else if (positionals.length > 0) {
    return usage(`"${command}" does not accept positional arguments`);
  }

  if (
    dryRun &&
    !(command === "init" || command === "add" || command === "sync")
  ) {
    return usage(`--dry-run is only valid for init, add and sync`);
  }
  if (source && command !== "view") {
    return usage(`--source is only valid for view`);
  }
  if (strict && command !== "doctor") {
    return usage(`--strict is only valid for doctor`);
  }

  return {
    kind: "command",
    command,
    item: takesItem ? positionals[0] : null,
    json: intent.json,
    cwd,
    dryRun,
    source,
    strict,
  };
}
