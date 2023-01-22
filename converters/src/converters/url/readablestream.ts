import { Converter, ConvertOptions } from "../../core.js";
import fetch from "../../supports/Fetch.js";

class URL_ReadableStream
  implements Converter<string, ReadableStream<Uint8Array>>
{
  async convert(
    src: string,
    options: ConvertOptions
  ): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(src, options.fetchRequestInit);
    const rs = response.body;
    if (rs == null) {
      throw response;
    }
    return rs;
  }
}

export default new URL_ReadableStream();
