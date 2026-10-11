/** Low-level publication fixtures still acquire a real physical writer. */
import assert from "node:assert/strict";

import { holdMutationAuthority } from "../../src/codegen/mutation-authority.js";
import { publishLock } from "../../src/codegen/publish-lock.js";
import type { LockValidationContext } from "../../src/codegen/lock.js";
import type { TransactionHooks } from "../../src/codegen/transaction-hooks.js";
import type { OwnedCreation } from "../../src/codegen/transaction-inventory.js";
import type { TransactionJournal } from "../../src/codegen/transaction-journal.js";
import { lockPath, stagedDir } from "../../src/codegen/transaction-types.js";
import {
  acquireWriterLock,
  holdsWriterLock,
  releaseWriterLock,
} from "../../src/codegen/write-lock.js";

export function publishPreparedLock(
  root: string,
  stateDir: string,
  journal: TransactionJournal,
  bytes: Uint8Array,
  mode = 0o644,
  context: LockValidationContext = {},
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
      lockPath(stateDir),
      `${stagedDir(stateDir, journal.transactionId)}/kit.lock.json`,
    ]);
    return publishLock(
      root,
      stateDir,
      journal,
      bytes,
      mode,
      context,
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
