/** Exercise low-level replacement fixtures under real physical coordination. */
import assert from "node:assert/strict";

import { holdMutationAuthority } from "../../src/transactions/mutation-authority.js";
import { applyReplacements } from "../../src/transactions/replace.js";
import type { StagedBatch } from "../../src/transactions/stage.js";
import type { TransactionHooks } from "../../src/transactions/hooks.js";
import type { OwnedCreation } from "../../src/transactions/inventory.js";
import type { TransactionJournal } from "../../src/transactions/journal.js";
import { backupsDir } from "../../src/transactions/types.js";
import {
  acquireWriterLock,
  holdsWriterLock,
  releaseWriterLock,
} from "../../src/transactions/write-lock.js";

export function applyPreparedReplacements(
  root: string,
  stateDir: string,
  journal: TransactionJournal,
  staged: StagedBatch,
  hooks?: TransactionHooks,
  ownership?: OwnedCreation[],
) {
  const acquired = holdsWriterLock(root, stateDir)
    ? null
    : acquireWriterLock(root, stateDir, journal.transactionId);
  if (acquired !== null && !acquired.ok)
    throw new Error(JSON.stringify(acquired.issues));
  try {
    const authority = holdMutationAuthority(root, [
      ...journal.operations.map((entry) => entry.path),
      ...staged.records.map((entry) => entry.stagedPath),
      `${backupsDir(stateDir, journal.transactionId)}/entry`,
    ]);
    return applyReplacements(
      root,
      stateDir,
      journal,
      staged,
      hooks,
      ownership,
      authority,
    );
  } finally {
    if (acquired?.ok) {
      const released = releaseWriterLock(acquired.value);
      assert.equal(released.ok, true, JSON.stringify(released));
    }
  }
}
