import { ConvertStringOptions, Encoding } from "encoding-japanese";
import { Converter, ConvertOptions } from "../../core.js";
import { hasBuffer, toBuffer } from "../../supports/Environment.js";
import {
  BUFFER_ENCODINGS,
  EJ_ENCODINGS,
  getEncodingJapanese,
  getIconv,
  getTextDecoder,
} from "../../supports/StringUtil.js";

class Uint8Array_String implements Converter<Uint8Array, string> {
  async convert(
    src: Uint8Array,
    options?: ConvertOptions | undefined
  ): Promise<string> {
    const srcTextEncoding = options?.srcTextEncoding ?? "utf8";
    if (hasBuffer && 0 <= BUFFER_ENCODINGS.indexOf(srcTextEncoding)) {
      const buffer = toBuffer(src);
      // eslint-disable-next-line
      return buffer.toString(srcTextEncoding as any);
    }

    if (srcTextEncoding === "utf8") {
      return getTextDecoder().decode(src);
    }

    if (srcTextEncoding === "utf16le") {
      return String.fromCharCode.apply(null, Array.from(src));
    }

    if (0 <= EJ_ENCODINGS.indexOf(srcTextEncoding)) {
      const ej = await getEncodingJapanese();
      if (ej) {
        const opts: ConvertStringOptions = {
          from: srcTextEncoding.toUpperCase() as Encoding,
          to: "UNICODE",
          type: "string",
        };
        return ej.convert(src, opts);
      }
    }

    const iconv = await getIconv();
    if (iconv) {
      if (iconv.encodingExists(srcTextEncoding)) {
        const buffer = toBuffer(src);
        return iconv.decode(buffer, srcTextEncoding);
      }
    }

    throw new Error("Not supported srcTextEncoding: " + srcTextEncoding);
  }
}

export default new Uint8Array_String();
