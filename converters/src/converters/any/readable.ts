import { Readable } from "stream";
import { Converter, ConvertOptions } from "../../core.js";
import UNIV_CONV from "../../UnivConv.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
class Any_Readable implements Converter<any, Readable> {
  public async convert(src: any, options: ConvertOptions): Promise<Readable> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const u8 = await UNIV_CONV.convert(src, Uint8Array, options);
    return UNIV_CONV.convert(u8, "readable", options);
  }
}

export default new Any_Readable();
