import { Converter, ConvertOptions } from "../../core.js";
import fetch from "../../supports/Fetch.js";

class URL_ArrayBuffer implements Converter<string, ArrayBuffer> {
  async convert(src: string, options: ConvertOptions): Promise<ArrayBuffer> {
    const response = await fetch(src, options.fetchRequestInit);
    return await response.arrayBuffer();
  }
}

export default new URL_ArrayBuffer();
