/** Final cooperative mutation proof, held before returning fault hooks run. */
import path from "node:path";

import { FrozenMap } from "../project/immutable.js";
import { isSafeLogicalRelativePath } from "../project/paths.js";
import { issue, type ModelIssue } from "../registry/errors.js";
import {
  captureAncestors,
  observeRootIdentity,
  verifyAncestors,
  verifyInstalledReads,
  verifyReadFiles,
  verifyRootIdentity,
  type PlanReadset,
  type PlanAncestor,
} from "./authority.js";
import {
  capturePreimage,
  revalidatePreimages,
  type TargetPreimage,
} from "./revalidate.js";
import type { JournalCreatedDir } from "./transaction-journal.js";
import {
  verifyOwnedCreations,
  type OwnedCreation,
} from "./transaction-inventory.js";
import { verifyHeldWriterLock } from "./write-lock.js";

export interface MutationAuthority {
  readonly root: string;
  readonly readset: PlanReadset;
  readonly preimages: ReadonlyMap<string, TargetPreimage>;
  readonly created: readonly JournalCreatedDir[];
}

const HELD_AUTHORITIES = new WeakSet<MutationAuthority>();

/** Narrow an authentic held proof without approving newly observed facts. */
export function scopeMutationAuthority(
  authority: MutationAuthority,
  paths: readonly string[],
  preimages: readonly TargetPreimage[],
  removed: ReadonlySet<string> = new Set(),
): MutationAuthority {
  if (!HELD_AUTHORITIES.has(authority))
    throw new Error("the original held mutation authority is required");
  const needed = new Set<string>();
  for (const logical of paths) {
    const segments = logical.split("/");
    for (let index = 1; index < segments.length; index++)
      needed.add(segments.slice(0, index).join("/"));
  }
  const scoped: MutationAuthority = Object.freeze({
    root: authority.root,
    readset: Object.freeze({
      root: authority.readset.root,
      ancestors: Object.freeze(
        authority.readset.ancestors.filter(
          (entry) => needed.has(entry.path) && !removed.has(entry.path),
        ),
      ),
      files: Object.freeze([]),
      installed: Object.freeze([]),
    }),
    preimages: new FrozenMap(
      preimages.map((entry) => [
        entry.path,
        Object.freeze({
          ...entry,
          identity:
            entry.identity == null
              ? null
              : Object.freeze({ ...entry.identity }),
        }),
      ]),
    ),
    created: Object.freeze(
      authority.created.filter(
        (entry) => needed.has(entry.path) && !removed.has(entry.path),
      ),
    ),
  });
  HELD_AUTHORITIES.add(scoped);
  return scoped;
}

/**
 * Production supplies the sealed original readset/preimages. Additional
 * transient ancestry is captured once before mutation hooks; original planned
 * ancestry wins over that capture. Low-level fixtures capture their approval at
 * invocation and still require an actual held physical writer.
 */
export function holdMutationAuthority(
  root: string,
  paths: readonly string[],
  original?: {
    readonly readset: PlanReadset;
    readonly preimages: readonly TargetPreimage[];
    readonly created: readonly JournalCreatedDir[];
  },
): MutationAuthority {
  const observedRoot = observeRootIdentity(root);
  if (!observedRoot.ok)
    throw new Error(
      observedRoot.issues.map((entry) => entry.message).join("; "),
    );
  const ancestors = new Map<string, PlanAncestor>();
  for (const logical of paths) {
    const observed = captureAncestors(root, logical);
    if (!observed.ok)
      throw new Error(observed.issues.map((entry) => entry.message).join("; "));
    for (const entry of observed.value)
      ancestors.set(entry.path, Object.freeze({ ...entry }));
  }
  for (const entry of original?.readset.ancestors ?? [])
    ancestors.set(
      entry.path,
      Object.freeze({
        ...entry,
        mode: entry.mode ?? ancestors.get(entry.path)?.mode,
      }),
    );
  const authority: MutationAuthority = Object.freeze({
    root,
    readset: Object.freeze({
      root: Object.freeze({
        ...(original?.readset.root ?? observedRoot.value),
        mode: original?.readset.root.mode ?? observedRoot.value.mode,
      }),
      ancestors: Object.freeze([...ancestors.values()]),
      files: Object.freeze(
        (original?.readset.files ?? []).map((entry) =>
          Object.freeze({ ...entry }),
        ),
      ),
      installed: Object.freeze(
        (original?.readset.installed ?? []).map((entry) =>
          Object.freeze({ ...entry }),
        ),
      ),
    }),
    preimages: new FrozenMap(
      (
        original?.preimages ??
        paths.map((logical) => capturePreimage(root, logical))
      ).map((entry) => [
        entry.path,
        Object.freeze({
          ...entry,
          identity:
            entry.identity === null || entry.identity === undefined
              ? null
              : Object.freeze({ ...entry.identity }),
        }),
      ]),
    ),
    created: Object.freeze(
      (original?.created ?? []).map((entry) => Object.freeze({ ...entry })),
    ),
  });
  HELD_AUTHORITIES.add(authority);
  return authority;
}

/** Check the held original facts immediately before the cooperating syscall. */
export function verifyMutationAuthority(
  authority: MutationAuthority,
  root: string,
  stateDir: string,
  receipts: readonly OwnedCreation[] = [],
  paths: readonly string[] = [],
): ModelIssue[] {
  if (!HELD_AUTHORITIES.has(authority) || authority.root !== root) {
    return [
      issue(
        "MUTATION_AUTHORITY_INVALID",
        "the original held mutation authority is required",
      ),
    ];
  }
  if (
    paths.some((logical) => !isSafeLogicalRelativePath(logical)) ||
    receipts.some(
      (entry) =>
        !isSafeLogicalRelativePath(
          path.relative(root, entry.path).split(path.sep).join("/"),
        ),
    )
  ) {
    return [
      issue(
        "MUTATION_AUTHORITY_INVALID",
        "a required mutation path or held creation receipt is outside the selected root",
      ),
    ];
  }
  const issues = [
    ...verifyHeldWriterLock(root, stateDir),
    ...verifyRootIdentity(root, authority.readset.root),
    ...verifyReadFiles(root, authority.readset.files),
    ...verifyInstalledReads(root, authority.readset.installed ?? []),
    ...verifyOwnedCreations(receipts),
  ];
  const ancestors = new Map(
    authority.readset.ancestors.map((entry) => [entry.path, entry]),
  );
  for (const entry of authority.created)
    ancestors.set(entry.path, {
      ...entry,
      kind: "directory",
      mode: entry.mode ?? ancestors.get(entry.path)?.mode,
    });
  for (const entry of receipts) {
    if (entry.kind !== "directory") continue;
    const logical = path.relative(root, entry.path).split(path.sep).join("/");
    ancestors.set(logical, {
      path: logical,
      kind: "directory",
      device: entry.device,
      inode: entry.inode,
      mode: entry.mode,
    });
  }
  for (const logical of paths) {
    const segments = logical.split("/");
    for (let index = 1; index < segments.length; index++) {
      const ancestor = segments.slice(0, index).join("/");
      if (!ancestors.has(ancestor))
        return [
          ...issues,
          issue(
            "MUTATION_AUTHORITY_INVALID",
            `mutation ancestry ${ancestor} was not captured in the held authority`,
            logical,
          ),
        ];
    }
  }
  issues.push(...verifyAncestors(root, [...ancestors.values()], true));
  return issues;
}

/** Prove an original preimage, or the absence required after moving a backup. */
export function verifyMutationTarget(
  authority: MutationAuthority,
  logical: string,
  absent = false,
): ModelIssue[] {
  if (!HELD_AUTHORITIES.has(authority))
    return [
      issue(
        "MUTATION_AUTHORITY_INVALID",
        "the original held mutation authority is required",
        logical,
      ),
    ];
  const expected = authority.preimages.get(logical);
  if (expected === undefined)
    return [
      issue(
        "MUTATION_AUTHORITY_INVALID",
        "the target has no original mutation preimage",
        logical,
      ),
    ];
  const result = revalidatePreimages(
    authority.root,
    [
      absent
        ? {
            path: logical,
            kind: "absent",
            digest: null,
            mode: null,
          }
        : expected,
    ],
    { ancestors: [] },
  );
  return result.ok ? [] : [...result.issues];
}
