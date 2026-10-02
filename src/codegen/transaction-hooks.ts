/**
 * Fault-injection boundaries for the guarded transaction engine (S068–S077).
 *
 * Recovery correctness has to be proven by interrupting the protocol at every
 * meaningful edge, not by prose. The engine calls `fire` before and after each
 * stage/replace/publish/cleanup/recovery boundary. Production callers pass no
 * hooks and observe no behavioral difference; a test or subprocess fixture can
 * supply a hook that throws (or exits) at a named boundary to simulate a crash
 * or an I/O failure deterministically.
 */
export type TransactionBoundary =
  | "transaction:create"
  | "journal:write"
  | "journal:fsync"
  | "stage:write"
  | "stage:verify"
  | "backup:move"
  | "replace:apply"
  | "progress:persist"
  | "lock:stage"
  | "lock:publish"
  | "cleanup:staged"
  | "cleanup:backups"
  | "cleanup:progress"
  | "cleanup:journal"
  | "recovery:restore"
  | "recovery:cleanup";

export interface TransactionHooks {
  readonly before?: (boundary: TransactionBoundary, detail?: string) => void;
  readonly after?: (boundary: TransactionBoundary, detail?: string) => void;
}

/** Fire one boundary event, propagating any thrown fault. */
export function fireHooks(
  hooks: TransactionHooks | undefined,
  event: "before" | "after",
  boundary: TransactionBoundary,
  detail?: string,
): void {
  const handler = hooks?.[event];
  if (handler) handler(boundary, detail);
}

/** Build a hook that throws exactly at the named boundary (once). */
export function faultAt(
  boundary: TransactionBoundary,
  message = `injected fault at ${boundary}`,
): TransactionHooks {
  let fired = false;
  return {
    before: (candidate) => {
      if (!fired && candidate === boundary) {
        fired = true;
        throw new Error(message);
      }
    },
  };
}
