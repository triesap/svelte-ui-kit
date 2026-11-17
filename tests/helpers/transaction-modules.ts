/** Expected mechanical source/distribution ownership; never runtime authority. */
export const TRANSACTION_MODULE_MOVES = [
  ["apply", "apply"],
  ["stage", "stage"],
  ["replace", "replace"],
  ["publish-lock", "publish-lock"],
  ["publication-intent", "publication-intent"],
  ["recovery", "recovery"],
  ["write-lock", "write-lock"],
  ["durability", "durability"],
  ["owned-ancestry", "owned-ancestry"],
  ["mutation-authority", "mutation-authority"],
  ["transaction-types", "types"],
  ["transaction-hooks", "hooks"],
  ["transaction-inventory", "inventory"],
  ["transaction-journal", "journal"],
  ["transaction-cleanup", "cleanup"],
] as const;
