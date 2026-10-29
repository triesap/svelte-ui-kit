/** Plan validation accepts inert records, arrays and native byte containers. */
import { types } from "node:util";

const BYTE_FIELDS: readonly PropertyKey[] = [
  "buffer",
  "byteOffset",
  "byteLength",
  "length",
  "constructor",
  "slice",
  "subarray",
  "toString",
  "valueOf",
  Symbol.iterator,
  Symbol.toPrimitive,
];

export function isPlanData(input: unknown): boolean {
  const ancestors = new Set<object>();
  function visit(value: unknown, depth: number): boolean {
    if (typeof value === "function") return false;
    if (value === null || typeof value !== "object") return true;
    if (depth > 128 || types.isProxy(value) || ancestors.has(value))
      return false;
    const prototype: unknown = Object.getPrototypeOf(value);
    if (types.isUint8Array(value)) {
      // Native indices cannot be accessors. Do not enumerate potentially large
      // byte buffers; only intrinsic byte/iteration operations are consumed.
      return (
        (prototype === Uint8Array.prototype ||
          prototype === Buffer.prototype) &&
        BYTE_FIELDS.every((key) => !Object.hasOwn(value, key)) &&
        !types.isSharedArrayBuffer(value.buffer)
      );
    }
    if (
      prototype !== Object.prototype &&
      prototype !== null &&
      !(Array.isArray(value) && prototype === Array.prototype)
    )
      return false;
    ancestors.add(value);
    for (const descriptor of Object.values(
      Object.getOwnPropertyDescriptors(value),
    )) {
      if (!("value" in descriptor) || !visit(descriptor.value, depth + 1))
        return false;
    }
    // Object.values does not enumerate symbol descriptor keys.
    for (const key of Object.getOwnPropertySymbols(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
      if (!("value" in descriptor) || !visit(descriptor.value, depth + 1))
        return false;
    }
    ancestors.delete(value);
    return true;
  }
  return visit(input, 0);
}
