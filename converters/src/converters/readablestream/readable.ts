import { Readable } from "stream";
import { ReadableOfReadableStream } from "../../supports/ReadableOfReadableStream.js";
import { AbstractConverter } from "../../UnivConv.js";

class ReadableStream_Readable extends AbstractConverter<
  ReadableStream<Uint8Array>,
  Readable
> {
  public _convert(src: ReadableStream<Uint8Array>): Promise<Readable> {
    return Promise.resolve(new ReadableOfReadableStream(src));
  }
}

export default new ReadableStream_Readable();
