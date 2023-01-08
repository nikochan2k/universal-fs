import { Readable } from "stream";
import { Converter, ConvertOptions } from "../../core.js";
import UNIV_CONV from "../../UnivConv.js";
import u2r from "../uint8array/readable.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
class Any_Readable implements Converter<any, Readable> {
  public async convert(
    src: any,
    options?: ConvertOptions | undefined
  ): Promise<Readable> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const u8 = await UNIV_CONV.convert(src, Uint8Array, options);
    return u2r._convert(u8);
  }
}

export default new Any_Readable();
