import { isReadable, Readable } from "stream";
import { handleReadable } from "../../supports/NodeStream.js";
import { AbstractConverter } from "../../UnivConv.js";

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

class Readable_ReadableStream extends AbstractConverter<
  Readable,
  ReadableStream<Uint8Array>
> {
  public _convert(src: Readable): Promise<ReadableStream<Uint8Array>> {
    return Promise.resolve(createReadableStreamOfReadable(src));
  }
}

export default new Readable_ReadableStream();
