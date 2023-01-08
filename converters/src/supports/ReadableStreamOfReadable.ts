import { Readable } from "stream";
import { handleReadable, isReadable } from "./NodeStream.js";

export function createReadableStreamOfReadable(
  readable: Readable
): ReadableStream<Uint8Array> {
  if (isReadable(readable) && typeof Readable.toWeb === "function") {
    return Readable.toWeb(readable) as ReadableStream<Uint8Array>;
  }

  return new ReadableStream<Uint8Array>({
    start: (controller) => {
      handleReadable(readable, (value) => {
        controller.enqueue(value);
        return true;
      }).catch((e) => {
        console.warn(e);
      });
    },
    cancel: (err) => {
      if (isReadable(readable)) {
        readable.destroy(err as Error);
      }
    },
  });
}
