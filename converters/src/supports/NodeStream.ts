import type { Writable, Readable } from "stream";

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

export function pipeNodeStream(
  readable: NodeJS.ReadableStream,
  writable: NodeJS.WritableStream
) {
  return new Promise<void>((resolve, reject) => {
    readable.once("error", reject);
    writable.once("error", reject);
    writable.once("finish", resolve);
    readable.pipe(writable);
  });
}

let _Writable: typeof Writable | undefined;

export async function handleReadable(
  readable: Readable,
  onData: (chunk: Buffer) => void
): Promise<void> {
  if (isReadable(readable) && readable.destroyed) {
    return;
  }

  if (!_Writable) {
    _Writable = (await import("stream")).Writable;
  }

  const writable = new _Writable({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    write(chunk: any, _: string, next: (error?: Error | null) => void): void {
      try {
        onData(chunk as Buffer);
        next();
      } catch (e) {
        next(e as Error);
      }
    },
  });
  await pipeNodeStream(readable, writable);
}

export function closeStream(stream?: Readable | Writable, reason?: unknown) {
  if (!stream) {
    return;
  }

  stream.destroy(reason as Error | undefined);
}
