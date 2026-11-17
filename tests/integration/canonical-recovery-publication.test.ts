import assert from "node:assert/strict";
import {
  mkdirSync,
  writeFileSync,
  renameSync,
  rmdirSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { sha256Hex } from "../../src/codegen/digest.js";
import { parseKitLock } from "../../src/codegen/lock.js";
import {
  observeFileIdentity,
  writePublicationIntent,
} from "../../src/codegen/publication-intent.js";
import { recoverTransaction } from "../../src/codegen/recovery.js";
import { persistJournal } from "../../src/codegen/transaction-journal.js";
import {
  journalPath,
  lockPath,
  publicationIntentPath,
  stagedDir,
} from "../../src/codegen/transaction-types.js";
import { mappedIntegration } from "../../src/project/integration-fields.js";
import type { TargetKind } from "../../src/project/config.js";
import { createTempProject } from "../helpers/project.js";
import { liveRootIdentity } from "../helpers/transactions.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
const stateDir = "components/design/_kit",
  id = "1111111111111111";
function roots(target: TargetKind) {
  const common = {
    configSchema: 1 as const,
    uiDir: "components/design",
    stylesDir: "theme/site",
  };
  return target === "svelte-library"
    ? { ...common, target, styleEntry: "style/index.css" }
    : {
        ...common,
        target,
        layoutFile:
          target === "astro" ? "app/Shell.astro" : "app/routes/+layout.svelte",
      };
}
function lock(target: TargetKind, foreignMapping: boolean) {
  const mapping = roots(target);
  return {
    schemaVersion: 1,
    target,
    toolVersion: "0.2.0",
    registryVersion: "0.1.6",
    registryHash: "a".repeat(64),
    configHash: "b".repeat(64),
    requested: [],
    items: [],
    files: [],
    cssBlocks: [],
    integrations: [
      { ...mappedIntegration(mapping), baseline: "e".repeat(64) },
      {
        kind: "stylesheet",
        path: foreignMapping ? "foreign/site/kit.css" : "theme/site/kit.css",
        contract: "stylesheet-v1",
        baseline: "e".repeat(64),
      },
      {
        kind: "exports",
        path: "components/design/index.ts",
        contract: "exports-v1",
        baseline: "e".repeat(64),
      },
    ],
  };
}
for (const target of ["sveltekit", "astro", "svelte-library"] as const)
  for (const journalBacked of [false, true])
    for (const variant of [
      "canonical",
      "foreign-target",
      "foreign-mapping",
      "retired",
    ] as const)
      test(`${target}: ${journalBacked ? "journal-backed" : "journal-less"} physical publication ${variant}`, (t) => {
        const f = createTempProject();
        let passed = false;
        t.after(() => {
          if (passed) f.cleanup();
          else console.error(`Retained failed owned publication: ${f.root}`);
        });
        const record = lock(
          variant === "foreign-target"
            ? target === "astro"
              ? "sveltekit"
              : "astro"
            : target,
          variant === "foreign-mapping",
        );
        if (variant === "retired") record.schemaVersion = 2;
        else
          assert.equal(
            parseKitLock(record).ok,
            true,
            "negative target/mapping remains structurally canonical",
          );
        const bytes = JSON.stringify(record),
          digest = sha256Hex(bytes);
        const staged = path.join(
          f.root,
          stagedDir(stateDir, id),
          "kit.lock.json",
        );
        mkdirSync(path.dirname(staged), { recursive: true });
        writeFileSync(staged, bytes, { mode: 0o644 });
        const image = observeFileIdentity(staged);
        assert.ok(image);
        const rootIdentity = liveRootIdentity(f.root),
          planDigest = "c".repeat(64);
        writePublicationIntent(f.root, publicationIntentPath(stateDir, id), {
          schemaVersion: 1,
          transactionId: id,
          rootIdentity,
          planDigest,
          digest,
          mode: statSync(staged).mode & 0o7777,
          preimage: null,
          staged: image,
        });
        renameSync(staged, path.join(f.root, lockPath(stateDir)));
        // A legal journal-less cleanup tail has already removed staged inventory.
        if (!journalBacked) rmdirSync(path.dirname(staged));
        if (journalBacked)
          persistJournal(f.root, journalPath(stateDir, id), {
            schemaVersion: 3,
            target,
            transactionId: id,
            rootIdentity,
            planDigest,
            phase: "published",
            operations: [],
            lock: {
              path: lockPath(stateDir),
              digest,
              published: true,
              unchanged: false,
            },
            createdDirs: [],
            ignoreFiles: [],
          });
        f.writeFile(".operator-note", "preserve unrelated bytes");
        const before = snapshotTree(f.root),
          result = recoverTransaction(f.root, stateDir, id, roots(target));
        if (variant === "canonical") {
          assert.equal(
            result.status,
            journalBacked ? "committed" : "cleaned",
            JSON.stringify(result),
          );
          const outsideTransient = (rows: ReturnType<typeof snapshotTree>) =>
            rows.filter(
              (v) => !v.path.startsWith(`${stateDir}/.svelte-ui-kit`),
            );
          assert.deepEqual(
            outsideTransient(snapshotTree(f.root)),
            outsideTransient(before),
          );
        } else {
          assert.equal(result.status, "refused", JSON.stringify(result));
          assert.ok(
            result.issues.some(
              (i) => i.code.startsWith("LOCK_") || i.code === "SCHEMA_INVALID",
            ),
            JSON.stringify(result),
          );
          assert.deepEqual(snapshotTree(f.root), before);
        }
        passed = true;
      });
