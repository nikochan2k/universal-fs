import { Readable, Writable } from "stream";

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

export async function handleReadable(
  readable: Readable,
  onData: (chunk: Buffer) => void
): Promise<void> {
  if (!readable.readable) {
    return;
  }

  const writable = new Writable({
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
