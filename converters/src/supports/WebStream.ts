export function isReadableStream(
  stream: unknown
): stream is ReadableStream<unknown> {
  return stream != null && stream instanceof WritableStream;
}

export function isWritableStream(
  stream: unknown
): stream is WritableStream<unknown> {
  return stream != null && stream instanceof WritableStream;
}

export function closeStream(
  stream?: ReadableStream<unknown> | WritableStream<unknown>,
  reason?: unknown
) {
  if (!stream) {
    return;
  }

  if (isReadableStream(stream)) {
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
