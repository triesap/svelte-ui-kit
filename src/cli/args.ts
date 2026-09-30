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
 * `--help`/`-h` and `--version`/`-V` remain stable and are valid only alone.
 * Rejected force/remove/auto-install/remote-registry options fail explicitly
 * rather than being quietly accepted.
 *
 * A usage error still records whether `--json` was requested and which
 * recognized product command was present, so the executor can emit one
 * deterministic JSON envelope without re-parsing raw arguments. An absent or
 * unknown command is attributed to the existing `help` surface.
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
  | { readonly kind: "help" }
  | { readonly kind: "version" }
  | CommandRequest
  | {
      readonly kind: "usage-error";
      readonly message: string;
      readonly argv: readonly string[];
      readonly json: boolean;
      readonly command: ProductCommand | "help";
    };

function isProductCommand(value: string | null): value is ProductCommand {
  return (
    value !== null && (PRODUCT_COMMANDS as readonly string[]).includes(value)
  );
}

function usage(
  message: string,
  argv: readonly string[],
  json: boolean,
  command: string | null,
): CliRequest {
  return {
    kind: "usage-error",
    message,
    argv: [...argv],
    json,
    command: isProductCommand(command) ? command : "help",
  };
}

/** Classify `argv` (already sliced past the executable/script). */
export function parseCliArgs(argv: readonly string[]): CliRequest {
  if (argv.length === 0) return { kind: "help" };
  const first = argv[0];
  if (argv.length === 1 && (first === "--help" || first === "-h")) {
    return { kind: "help" };
  }
  if (argv.length === 1 && (first === "--version" || first === "-V")) {
    return { kind: "version" };
  }

  let command: string | null = null;
  const positionals: string[] = [];
  const seen = new Set<string>();
  let json = false;
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
      return usage(`${arg} must be used alone`, argv, json, command);
    }
    if (arg === "--json") {
      if (seen.has("json")) {
        return usage("duplicate --json", argv, json, command);
      }
      seen.add("json");
      json = true;
      continue;
    }
    if (arg === "--dry-run") {
      if (seen.has("dry-run")) {
        return usage("duplicate --dry-run", argv, json, command);
      }
      seen.add("dry-run");
      dryRun = true;
      continue;
    }
    if (arg === "--source") {
      if (seen.has("source")) {
        return usage("duplicate --source", argv, json, command);
      }
      seen.add("source");
      source = true;
      continue;
    }
    if (arg === "--strict") {
      if (seen.has("strict")) {
        return usage("duplicate --strict", argv, json, command);
      }
      seen.add("strict");
      strict = true;
      continue;
    }
    if (arg === "--cwd") {
      if (seen.has("cwd")) {
        return usage("duplicate --cwd", argv, json, command);
      }
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("-")) {
        return usage("--cwd requires a directory value", argv, json, command);
      }
      seen.add("cwd");
      cwd = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--cwd=")) {
      if (seen.has("cwd")) {
        return usage("duplicate --cwd", argv, json, command);
      }
      const value = arg.slice("--cwd=".length);
      if (value === "") {
        return usage("--cwd requires a directory value", argv, json, command);
      }
      seen.add("cwd");
      cwd = value;
      continue;
    }
    if (arg.startsWith("-")) {
      return usage(`unsupported option: ${arg}`, argv, json, command);
    }
    if (command === null) command = arg;
    else positionals.push(arg);
  }

  if (command === null) {
    return usage("no command was given", argv, json, command);
  }
  if (!isProductCommand(command)) {
    return usage(`unknown command: ${command}`, argv, json, command);
  }

  const takesItem = command === "view" || command === "add";
  if (takesItem) {
    if (positionals.length === 0) {
      return usage(
        `"${command}" requires exactly one item`,
        argv,
        json,
        command,
      );
    }
    if (positionals.length > 1) {
      return usage(
        `"${command}" accepts exactly one item`,
        argv,
        json,
        command,
      );
    }
    if (!isItemId(positionals[0])) {
      return usage(`invalid item id: ${positionals[0]}`, argv, json, command);
    }
  } else if (positionals.length > 0) {
    return usage(
      `"${command}" does not accept positional arguments`,
      argv,
      json,
      command,
    );
  }

  if (
    dryRun &&
    !(command === "init" || command === "add" || command === "sync")
  ) {
    return usage(
      `--dry-run is only valid for init, add and sync`,
      argv,
      json,
      command,
    );
  }
  if (source && command !== "view") {
    return usage(`--source is only valid for view`, argv, json, command);
  }
  if (strict && command !== "doctor") {
    return usage(`--strict is only valid for doctor`, argv, json, command);
  }

  return {
    kind: "command",
    command,
    item: takesItem ? positionals[0] : null,
    json,
    cwd,
    dryRun,
    source,
    strict,
  };
}
