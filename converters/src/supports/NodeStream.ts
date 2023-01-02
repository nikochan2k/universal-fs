import { Writable, Readable } from "stream";

export function isReadable(stream: unknown): stream is Readable {
  return stream != null && stream instanceof Readable && stream.readable;
}

export function isWritable(stream: unknown): stream is Writable {
  return stream != null && stream instanceof Writable && stream.writable;
}

export function pipe(readable: Readable, writable: Writable) {
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
  if (isReadable(readable) && readable.destroyed) {
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
  await pipe(readable, writable);
}

export function closeStream(stream?: Readable | Writable, reason?: unknown) {
  if (!stream) {
    return;
  }

  stream.destroy(reason as Error | undefined);
}
