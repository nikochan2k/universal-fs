import { Converter, ConvertOptions } from "../../core.js";
import UNIV_CONV from "../../UnivConv.js";
import type u2a from "./arraybuffer.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
class URL_Any implements Converter<string, any> {
  private u2a?: typeof u2a;

  async convert(src: string, options: ConvertOptions): Promise<any> {
    if (!this.u2a) {
      this.u2a = (await import("./arraybuffer.js")).default;
    }
    const ab = await this.u2a.convert(src, options);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return await UNIV_CONV.convert(ab, options.dstType!, options);
  }
}

export default new URL_Any();
