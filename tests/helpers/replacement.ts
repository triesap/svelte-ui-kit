/** Exercise low-level replacement fixtures under real physical coordination. */
import assert from "node:assert/strict";

import { holdMutationAuthority } from "../../src/codegen/mutation-authority.js";
import { applyReplacements } from "../../src/codegen/replace.js";
import type { StagedBatch } from "../../src/codegen/stage.js";
import type { TransactionHooks } from "../../src/codegen/transaction-hooks.js";
import type { OwnedCreation } from "../../src/codegen/transaction-inventory.js";
import type { TransactionJournal } from "../../src/codegen/transaction-journal.js";
import { backupsDir } from "../../src/codegen/transaction-types.js";
import {
  acquireWriterLock,
  holdsWriterLock,
  releaseWriterLock,
} from "../../src/codegen/write-lock.js";

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
