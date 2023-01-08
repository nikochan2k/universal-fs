import { Converter, ConvertOptions } from "../../core.js";
import { handleReadableStream } from "../../supports/WebStream.js";
import UNIV_CONV from "../../UnivConv.js";
import support from "../../supports/TypedArray.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
class ReadableStream_Any implements Converter<ReadableStream<Uint8Array>, any> {
  async convert(
    src: ReadableStream<Uint8Array>,
    options: ConvertOptions
  ): Promise<any> {
    const buffers: Uint8Array[] = [];
    await handleReadableStream(src, async (chunk) => {
      buffers.push(chunk);
      return Promise.resolve();
    });
    const buffer = support.merge(buffers, (length) => new Uint8Array(length));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return await UNIV_CONV.convert(buffer, options.dstType!);
  }
}

export default new ReadableStream_Any();
