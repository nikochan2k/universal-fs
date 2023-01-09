import { Converter, ConvertOptions } from "../../core.js";
import UNIV_CONV from "../../UnivConv.js";
import h2u from "./uint8array.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
class Hex_Any implements Converter<string, any> {
  async convert(src: string, options: ConvertOptions): Promise<any> {
    const u8 = await h2u._convert(src);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return await UNIV_CONV.convert(u8, options.dstType!, options);
  }
}

export default new Hex_Any();
