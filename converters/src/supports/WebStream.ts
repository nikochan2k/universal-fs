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

export function closeReadableStream(stream: ReadableStream, reason?: unknown) {
  if (reason) {
    stream.cancel(reason).catch((e) => console.debug(e));
  } else {
    stream.cancel().catch((e) => console.debug(e));
  }
}

export function closeWritableStream(stream: WritableStream, reason?: unknown) {
  if (reason) {
    stream.abort(reason).catch((e) => console.debug(e));
  } else {
    stream.close().catch((e) => console.debug(e));
  }
}

export async function handleReadableStream(
  stream: ReadableStream<Uint8Array>,
  onData: (chunk: Uint8Array) => Promise<boolean>
): Promise<void> {
  const reader = stream.getReader();
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
    closeReadableStream(stream);
  } catch (e) {
    reader.releaseLock();
    closeReadableStream(stream, e);
  }
}
