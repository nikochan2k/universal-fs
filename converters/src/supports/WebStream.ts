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

export async function handleReadableStream(
  stream: ReadableStream<Uint8Array>,
  onData: (chunk: Uint8Array) => Promise<void>
): Promise<void> {
  const reader = stream.getReader();
  try {
    let res = await reader.read();
    while (!res.done) {
      await onData(res.value);
      res = await reader.read();
    }
    reader.releaseLock();
    closeReadableStream(stream);
  } catch (e) {
    reader.releaseLock();
    closeReadableStream(stream, e);
  }
}

export async function pipeWebStream(
  readable: ReadableStream<Uint8Array>,
  writable: WritableStream<Uint8Array>
) {
  if (typeof readable.pipeTo === "function") {
    await readable.pipeTo(writable);
  } else {
    const writer = writable.getWriter();
    await handleReadableStream(readable, async (chunk) => {
      await writer.write(chunk);
    });
  }
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
