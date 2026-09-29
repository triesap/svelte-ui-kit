/**
 * Read-only registry snapshot boundary.
 *
 * This expresses the immutable, validated registry view that code generation
 * resolves against. It is a type-only interface: importing it performs no
 * asset loading and no validation. The versioned registry implementation is
 * scheduled for the registry checkpoints, not here.
 */
export interface RegistryItemRef {
  /** Stable registry item identifier. */
  readonly id: string;
  /** Registry-relative item path. */
  readonly path: string;
}

export interface RegistrySnapshot {
  /** Registry/schema version identity for the snapshot. */
  readonly version: string;
  /** Immutable item inventory in deterministic order. */
  readonly items: readonly RegistryItemRef[];
}
