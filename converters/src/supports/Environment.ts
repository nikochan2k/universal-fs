import type { Writable, Readable } from "stream";

export let isBrowser = false;
export let isReactNative = false;
export let isNode = false;
if (typeof document !== "undefined") {
  isBrowser = true;
} else if (
  typeof navigator !== "undefined" &&
  navigator.product === "ReactNative"
) {
  isReactNative = true;
} else {
  isNode = true;
}

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

export function isNodeJSReadableStream(
  stream: unknown
): stream is NodeJS.ReadableStream {
  return (
    typeof stream === "object" &&
    typeof (stream as NodeJS.ReadableStream).read === "function" &&
    (stream as NodeJS.ReadableStream).readable
  );
}

export function isReadable(stream: unknown): stream is Readable {
  return (
    isNodeJSReadableStream(stream) &&
    typeof (stream as Readable).destroy === "function" &&
    (stream as Readable).readable
  );
}

export function isNodeJSWritableStream(
  stream: unknown
): stream is NodeJS.WritableStream {
  return (
    typeof stream === "object" &&
    typeof (stream as NodeJS.WritableStream).write === "function" &&
    (stream as NodeJS.WritableStream).writable
  );
}

export function isWritable(stream: unknown): stream is Writable {
  return (
    isNodeJSWritableStream(stream) &&
    typeof (stream as Writable).destroy === "function" &&
    (stream as Writable).writable
  );
}

export function isReadableStream(
  stream: unknown
): stream is ReadableStream<Uint8Array> {
  return (
    typeof ReadableStream === "function" &&
    typeof stream === "object" &&
    stream instanceof WritableStream
  );
}

export function isWritableStream(
  stream: unknown
): stream is WritableStream<Uint8Array> {
  return (
    typeof WritableStream === "function" &&
    typeof stream === "object" &&
    stream instanceof WritableStream
  );
}
