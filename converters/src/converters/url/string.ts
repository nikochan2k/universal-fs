import { Converter, ConvertOptions } from "../../core.js";
import { newBuffer } from "../../supports/Environment.js";
import UNIV_CONV from "../../UnivConv.js";

class URL_String implements Converter<string, string> {
  public async convert(src: string, options: ConvertOptions): Promise<string> {
    const response = await fetch(src, options.fetchRequestInit);
    const dstTextEncoding = options.dstTextEncoding || "utf8";
    if (dstTextEncoding === "utf8") {
      return await response.text();
    }
    const ab = await response.arrayBuffer();
    return await UNIV_CONV.convert(newBuffer(ab), "string", options);
  }
}

export default new URL_String();
