import { Converter, ConvertOptions } from "../../core.js";
import UNIV_CONV from "../../UnivConv.js";
import u2s from "../uint8array/string.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
class Any_String implements Converter<any, string> {
  public async convert(src: any, options: ConvertOptions): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const u8 = await UNIV_CONV.convert(src, Uint8Array, options);
    return await UNIV_CONV.convert(u8, "string", options);
  }
}

export default new Any_String();
