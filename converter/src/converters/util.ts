import type { Readable, Writable } from "stream";
import { Data } from "./core";

declare type FS = typeof import("fs");
declare type OS = typeof import("os");
declare type PATH = typeof import("path");
declare type URL = typeof import("url");
declare type STREAM = typeof import("stream");

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

export let hasBlob = false;
export let hasTextOnBlob = false;
export let hasStreamOnBlob = false;
export let hasArrayBufferOnBlob = false;
export let hasReadAsArrayBufferOnBlob = false;
export let hasReadAsBinaryStringOnBlob = false;
export let EMPTY_BLOB: Blob;
if (typeof Blob === "function") {
  hasBlob = true;
  EMPTY_BLOB = new Blob([]);
  if (Blob.prototype.text != null) {
    hasTextOnBlob = true;
  }
  if (Blob.prototype.stream != null) {
    hasStreamOnBlob = true;
  }
  if (Blob.prototype.arrayBuffer != null) {
    hasArrayBufferOnBlob = true;
  }
  if (!isReactNative) {
    hasReadAsArrayBufferOnBlob = FileReader.prototype.readAsArrayBuffer != null;
    hasReadAsBinaryStringOnBlob =
      FileReader.prototype.readAsBinaryString != null;
  }
}

export let hasReadableStream = false;
export let hasWritableStream = false;
if (typeof ReadableStream === "function") {
  hasReadableStream = true;
  hasWritableStream = true;
}

export let hasBuffer = false;
export let EMPTY_BUFFER: Buffer;
if (typeof Buffer === "function") {
  hasBuffer = true;
  EMPTY_BUFFER = Buffer.alloc(0);
}

/* eslint-disable */
let stream: any;
try {
  stream = require("stream");
} catch {}
/* eslint-enable */

export let hasReadable = false;
export let hasWritable = false;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
if (typeof stream?.Readable === "function") {
  hasReadable = true;
  hasWritable = true;
}

export function handleFileReader<T extends string | ArrayBuffer>(
  trigger: (reader: FileReader) => void,
  transform: (data: string | ArrayBuffer | null) => T
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

export function isReadableStream(
  stream: unknown
): stream is ReadableStream<Uint8Array> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return (
    hasReadableStream &&
    stream != null &&
    typeof (stream as ReadableStream<Uint8Array>).getReader === "function" &&
    typeof (stream as ReadableStream<Uint8Array>).cancel === "function"
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

export function isReadable(stream: unknown): stream is Readable {
  return (
    hasReadable &&
    stream != null &&
    typeof (stream as Readable).pipe === "function" &&
    (stream as Readable).readable
  );
}

export async function pipeWebStream(
  readable: ReadableStream<unknown>,
  writable: WritableStream<unknown>
) {
  if (typeof readable.pipeTo === "function") {
    await readable.pipeTo(writable);
  } else {
    const writer = writable.getWriter();
    await handleReadableStream(readable, async (chunk) => {
      await writer.write(chunk);
      return true;
    });
  }
}

export function isWritable(stream: unknown): stream is Writable {
  return (
    hasWritable &&
    stream != null &&
    typeof (stream as Writable).pipe === "function" &&
    (stream as Writable).writable
  );
}

export async function pipeNodeStream(readable: Readable, writable: Writable) {
  return new Promise<void>((resolve, reject) => {
    readable.once("error", reject);
    writable.once("error", reject);
    writable.once("finish", resolve);
    readable.pipe(writable);
  });
}

export async function handleReadable(
  readable: Readable,
  onData: (chunk: Data) => Promise<boolean>
): Promise<void> {
  if (readable.destroyed) {
    return;
  }

  const stream: STREAM = require("stream"); // eslint-disable-line
  const writable = new stream.Writable({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    write(chunk: any, _: string, next: (error?: Error | null) => void): void {
      onData(chunk as Data)
        .then((result) => {
          if (result) {
            next();
          } else {
            writable.destroy();
          }
        })
        .catch((e) => {
          writable.destroy(e as Error);
        });
    },
  });
  await pipeNodeStream(readable, writable);
}

export function closeStream(
  stream:
    | Readable
    | Writable
    | ReadableStream<Uint8Array>
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

export let getFileSize: ((fileURL: string) => Promise<number>) | undefined;
try {
  const url: URL = require("url"); // eslint-disable-line
  const fs: FS = require("fs"); // eslint-disable-line

  getFileSize = async (fileURL: string) => {
    const p = url.fileURLToPath(fileURL);
    return new Promise<number>((resolve, reject) => {
      fs.stat(p, (err, stats) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(stats.size);
      });
    });
  };
} catch {
  getFileSize = undefined;
}

export let fileToBuffer: ((filePath: string) => Buffer) | undefined;
try {
  const fs: FS = require("fs"); // eslint-disable-line

  fileToBuffer = (filePath: string) => fs.readFileSync(filePath);
} catch {
  fileToBuffer = undefined;
}

export let fileURLToReadable: ((fileURL: string) => Readable) | undefined;
try {
  const fs: FS = require("fs"); // eslint-disable-line
  const url: URL = require("url"); // eslint-disable-line
  fileURLToReadable = (fileURL: string) => {
    const filePath = url.fileURLToPath(fileURL);
    return fs.createReadStream(filePath);
  };
} catch {
  fileURLToReadable = undefined;
}

export let toFileURL:
  | ((readable: Readable, extension?: string) => Promise<string>)
  | undefined;
try {
  const fs: FS = require("fs"); // eslint-disable-line
  const os: OS = require("os"); // eslint-disable-line
  const path: PATH = require("path"); // eslint-disable-line
  const url: URL = require("url"); // eslint-disable-line

  toFileURL = async (readable: Readable, extension?: string) => {
    extension =
      typeof extension !== "undefined"
        ? extension.startsWith(".")
          ? extension
          : "." + extension
        : "";
    const joined = path.join(os.tmpdir(), Date.now().toString() + extension);
    const writable = fs.createWriteStream("dest.txt");
    await pipeNodeStream(readable, writable);
    const u = url.pathToFileURL(joined);
    return u.href;
  };
} catch {
  toFileURL = undefined;
}

export function dataUrlToBase64(dataUrl: string) {
  const index = dataUrl.indexOf(",");
  if (0 <= index) {
    return dataUrl.substring(index + 1);
  }
  return dataUrl;
}
