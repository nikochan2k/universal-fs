import { Converter, ConvertOptions } from "../../core.js";
import UNIV_CONV from "../../UnivConv.js";
import u2h from "../uint8array/hex.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
class Any_Hex implements Converter<any, string> {
  public async convert(src: any, options: ConvertOptions): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const u8 = await UNIV_CONV.convert(src, Uint8Array, options);
    // eslint-disable-next-line;
    return await u2h.convert(u8, options);
  }
}

export default new Any_Hex();
