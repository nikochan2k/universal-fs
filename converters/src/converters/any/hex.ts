import { Converter, ConvertOptions } from "../../core.js";
import UNIV_CONV from "../../UnivConv.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
class Any_Hex implements Converter<any, string> {
  public async convert(src: any, options: ConvertOptions): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const u8 = await UNIV_CONV.convert(src, Uint8Array, options);
    // eslint-disable-next-line;
    return await UNIV_CONV.convert(u8, "hex", options);
  }
}

export default new Any_Hex();
