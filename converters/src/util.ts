import type { Readable, Writable } from "stream";

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

export const DEFAULT_BUFFER_SIZE = 96 * 1024;

export let hasBlob = false;
export let hasTextOnBlob = false;
export let hasStreamOnBlob = false;
export let hasArrayBufferOnBlob = false;
export let hasReadAsArrayBufferOnBlob = false;
export let hasReadAsBinaryStringOnBlob = false;
if (typeof Blob === "function") {
  hasBlob = true;
  if (typeof Blob.prototype.text === "function") {
    hasTextOnBlob = true;
  }
  if (typeof Blob.prototype.stream === "function") {
    hasStreamOnBlob = true;
  }
  if (typeof Blob.prototype.arrayBuffer === "function") {
    hasArrayBufferOnBlob = true;
  }
  if (!isReactNative) {
    hasReadAsArrayBufferOnBlob =
      typeof FileReader.prototype.readAsArrayBuffer === "function";
    hasReadAsBinaryStringOnBlob =
      typeof FileReader.prototype.readAsBinaryString === "function";
  }
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

export function handleFileReader<T extends string | ArrayBufferLike>(
  trigger: (reader: FileReader) => void,
  transform: (data: string | ArrayBufferLike | null) => T
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = function (ev) {
      reject(reader.error || ev);
    };
    reader.onload = function () {
      resolve(transform(reader.result));
    };
    trigger(reader);
  });
}

export let hasReadableStream = false;
export let hasWritableStream = false;
if (typeof ReadableStream === "function") {
  hasReadableStream = true;
  hasWritableStream = true;
}

export function isReadableStream(
  stream: unknown
): stream is ReadableStream<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return (
    hasReadableStream &&
    stream != null &&
    typeof (stream as ReadableStream<unknown>).getReader === "function" &&
    typeof (stream as ReadableStream<unknown>).cancel === "function"
  );
}

export function isWritableStream(
  stream: unknown
): stream is WritableStream<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return (
    hasWritableStream &&
    stream != null &&
    typeof (stream as WritableStream<unknown>).getWriter === "function" &&
    typeof (stream as WritableStream<unknown>).close === "function"
  );
}

export function isNodeJSWritableStream(
  stream: unknown
): stream is NodeJS.WritableStream {
  return (
    isNode &&
    stream != null &&
    typeof (stream as NodeJS.WritableStream).write === "function" &&
    (stream as NodeJS.WritableStream).writable
  );
}

export function isWritable(stream: unknown): stream is Writable {
  return (
    isNodeJSWritableStream(stream) &&
    typeof (stream as Writable).destroy === "function"
  );
}

export function isNodeJSReadableStream(
  stream: unknown
): stream is NodeJS.ReadableStream {
  return (
    isNode &&
    stream != null &&
    typeof (stream as NodeJS.ReadableStream).read === "function" &&
    (stream as NodeJS.ReadableStream).readable
  );
}

export function isReadable(stream: unknown): stream is Readable {
  return (
    isNodeJSReadableStream(stream) &&
    typeof (stream as Readable).destroy === "function"
  );
}

export function closeStream(
  stream:
    | Readable
    | Writable
    | ReadableStream<unknown>
    | WritableStream<unknown>
    | undefined,
  reason?: unknown
) {
  if (!stream) {
    return;
  }

  if (isReadable(stream) || isWritable(stream)) {
    stream.destroy(reason as Error | undefined);
  } else if (isReadableStream(stream)) {
    if (reason) {
      stream.cancel(reason).catch((e) => console.debug(e));
    } else {
      stream.cancel().catch((e) => console.debug(e));
    }
  } else if (isWritableStream(stream)) {
    if (reason) {
      stream.abort(reason).catch((e) => console.debug(e));
    } else {
      stream.close().catch((e) => console.debug(e));
    }
  }
}

export async function handleReadableStream(
  source: ReadableStream,
  onData: (chunk: Uint8Array) => Promise<boolean>
): Promise<void> {
  const reader = source.getReader();
  try {
    let res: ReadableStreamReadResult<unknown>;
    do {
      res = await reader.read();
      const chunk = res.value as Uint8Array;
      if (chunk) {
        const result = await onData(chunk);
        if (!result) {
          break;
        }
      }
    } while (!res.done);
    reader.releaseLock();
    closeStream(source);
  } catch (e) {
    reader.releaseLock();
    closeStream(source, e);
  }
}

export function dataUrlToBase64(dataUrl: string) {
  const index = dataUrl.indexOf(",");
  if (0 <= index) {
    return dataUrl.substring(index + 1);
  }
  return dataUrl;
}
