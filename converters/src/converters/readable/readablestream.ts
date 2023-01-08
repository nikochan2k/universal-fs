import { Readable } from "stream";
import { createReadableStreamOfReadable } from "../../supports/ReadableStreamOfReadable.js";
import { AbstractConverter } from "../../UnivConv.js";

class Readable_ReadableStream extends AbstractConverter<
  Readable,
  ReadableStream<Uint8Array>
> {
  public _convert(src: Readable): Promise<ReadableStream<Uint8Array>> {
    return Promise.resolve(createReadableStreamOfReadable(src));
  }
}

export default new Readable_ReadableStream();
