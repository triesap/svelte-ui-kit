/**
 * Deep immutability helpers for captured invocation evidence.
 *
 * A planner reasons about one observation. If any captured value can still be
 * mutated by a caller — a nested manifest dependency, an installed metadata
 * object, a manager field or an issue array — the same snapshot can silently
 * change from executable to a conflict without any disk edit. These helpers
 * freeze plain objects/arrays recursively and expose a genuinely read-only
 * lookup with no `set`/`delete`/`clear` mutators.
 *
 * Typed arrays and functions are frozen as values (their elements are not
 * traversed), so captured bytes stay observable without being cloned again.
 */

/** Recursively freeze a plain object/array graph. Cycles are handled once. */
export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (ArrayBuffer.isView(value)) return value;
  if (Object.isFrozen(value)) return value;
  Object.freeze(value);
  if (Array.isArray(value)) {
    for (const entry of value) deepFreeze(entry);
    return value;
  }
  for (const key of Object.keys(value as Record<string, unknown>)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return value;
}

/**
 * A genuinely immutable lookup over captured observations. It implements the
 * read-only subset of `ReadonlyMap`; there is no `set`, `delete` or `clear`, so
 * a caller cannot remove or replace captured evidence.
 */
export class FrozenMap<V> implements ReadonlyMap<string, V> {
  readonly #map: Map<string, V>;

  constructor(source: Iterable<readonly [string, V]>) {
    this.#map = new Map(source);
    Object.freeze(this);
  }

  get size(): number {
    return this.#map.size;
  }

  get(key: string): V | undefined {
    return this.#map.get(key);
  }

  has(key: string): boolean {
    return this.#map.has(key);
  }

  forEach(
    callbackfn: (value: V, key: string, map: ReadonlyMap<string, V>) => void,
    thisArg?: unknown,
  ): void {
    this.#map.forEach((value, key) => {
      callbackfn.call(thisArg, value, key, this);
    });
  }

  keys(): MapIterator<string> {
    return this.#map.keys();
  }

  values(): MapIterator<V> {
    return this.#map.values();
  }

  entries(): MapIterator<[string, V]> {
    return this.#map.entries();
  }

  [Symbol.iterator](): MapIterator<[string, V]> {
    return this.#map.entries();
  }
}
