import { Writable, Readable } from "stream";

export function isReadable(stream: unknown): stream is Readable {
  return stream != null && stream instanceof Readable;
}

export function isWritable(stream: unknown): stream is Writable {
  return stream != null && stream instanceof Writable;
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
  onData: (chunk: Buffer) => Promise<void>
): Promise<void> {
  if (isReadable(readable) && readable.destroyed) {
    return;
  }

  const writable = new Writable({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    write(chunk: any, _: string, next: (error?: Error | null) => void): void {
      onData(chunk as Buffer)
        .then(() => next())
        .catch((e) => writable.destroy(e as Error));
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
