import { Converter, ConvertOptions } from "../../core.js";
import fetch from "../../supports/Fetch.js";

class URL_Blob implements Converter<string, Blob> {
  async convert(src: string, options: ConvertOptions): Promise<Blob> {
    const response = await fetch(src, options.fetchRequestInit);
    return await response.blob();
  }
}

export default new URL_Blob();
