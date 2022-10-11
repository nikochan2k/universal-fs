import type { createReadStream, createWriteStream, readFile, stat } from "fs";
import type { tmpdir } from "os";
import type { join } from "path";
import type { Readable, Writable } from "stream";
import type { fileURLToPath, pathToFileURL } from "url";
import { Data } from "./core";

export let hasReadable = false;
export let hasWritable = false;
/* eslint-disable */
(async () => {
  import("stream").then((stream) => {
    hasReadable = typeof stream.Readable === "function";
    hasWritable = typeof stream.Writable === "function";
  });
})();
/* eslint-enable */

let _Writable: typeof Writable | undefined;
let _fileURLToPath: typeof fileURLToPath | undefined;
let _pathToFileURL: typeof pathToFileURL | undefined;
let _stat: typeof stat | undefined;
let _createReadStream: typeof createReadStream | undefined;
let _createWriteStream: typeof createWriteStream | undefined;
let _readFile: typeof readFile | undefined;
let _tmpdir: typeof tmpdir | undefined;
let _join: typeof join | undefined;

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
    isNode &&
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
    isNode &&
    stream != null &&
    typeof (stream as Writable).pipe === "function" &&
    (stream as Writable).writable
  );
}

export function pipeNodeStream(readable: Readable, writable: Writable) {
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
  if (!_Writable) {
    _Writable = (await import("stream")).Writable;
  }

  if (readable.destroyed) {
    return;
  }

  const writable = new _Writable({
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

export async function getFileSize(fileURL: string) {
  if (!_fileURLToPath) {
    _fileURLToPath = (await import("url")).fileURLToPath;
  }
  if (!_stat) {
    _stat = (await import("fs")).stat;
  }

  const p = _fileURLToPath(fileURL);
  return await new Promise<number>((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    _stat!(p, (err, stats) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(stats.size);
    });
  });
}

export async function fileToBuffer(filePath: string) {
  if (!_readFile) {
    _readFile = (await import("fs")).readFile;
  }

  return new Promise<Buffer>((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    _readFile!(filePath, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(data);
    });
  });
}

export async function fileURLToReadable(fileURL: string) {
  if (!_fileURLToPath) {
    _fileURLToPath = (await import("url")).fileURLToPath;
  }
  if (!_createReadStream) {
    _createReadStream = (await import("fs")).createReadStream;
  }

  const filePath = _fileURLToPath(fileURL);
  return _createReadStream(filePath);
}

export async function toFileURL(readable: Readable, extension?: string) {
  if (!_join) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    _join = (await import("path")).join;
  }
  if (!_tmpdir) {
    _tmpdir = (await import("os")).tmpdir;
  }
  if (!_createWriteStream) {
    _createWriteStream = (await import("fs")).createWriteStream;
  }
  if (!_pathToFileURL) {
    _pathToFileURL = (await import("url")).pathToFileURL;
  }

  extension =
    typeof extension !== "undefined"
      ? extension.startsWith(".")
        ? extension
        : "." + extension
      : "";
  const joined = _join(_tmpdir(), Date.now().toString() + extension);
  const writable = _createWriteStream("dest.txt");
  await pipeNodeStream(readable, writable);
  const u = _pathToFileURL(joined);
  return u.href;
}

export function isBuffer(input: unknown): input is Buffer {
  return hasBuffer && input instanceof Buffer;
}

export function newBuffer(size: number) {
  return isNode ? Buffer.alloc(size) : new Uint8Array(size);
}

export function newBufferFrom(ab: ArrayBufferLike) {
  return isNode ? Buffer.from(ab) : new Uint8Array(ab);
}
