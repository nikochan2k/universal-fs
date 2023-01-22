import { Converter, ConvertOptions } from "../../core.js";
import UNIV_CONV from "../../UnivConv.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
class Any_ReadableStream implements Converter<any, ReadableStream<Uint8Array>> {
  public async convert(
    src: any,
    options: ConvertOptions
  ): Promise<ReadableStream<Uint8Array>> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const u8 = await UNIV_CONV.convert(src, Uint8Array, options);
    return UNIV_CONV.convert(u8, "readablestream", options);
  }
}

export default new Any_ReadableStream();
