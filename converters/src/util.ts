export const hasBuffer = typeof Buffer === "function";

export function newBuffer(input: number | number[] | ArrayBufferLike) {
  if (typeof input === "number") {
    return hasBuffer ? Buffer.alloc(input) : new Uint8Array(input);
  } else if (Array.isArray(input)) {
    return hasBuffer ? Buffer.from(input) : new Uint8Array(input);
  } else {
    return hasBuffer ? Buffer.from(input) : new Uint8Array(input);
  }
}
