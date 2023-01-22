import type { ConvertArrayBufferOptions, Encoding } from "encoding-japanese";
import { Converter, ConvertOptions } from "../../core.js";
import { hasBuffer } from "../../supports/Environment.js";
import {
  BUFFER_ENCODINGS,
  EJ_ENCODINGS,
  getEncodingJapanese,
  getIconv,
  getTextEncoder,
} from "../../supports/StringUtil.js";

class String_Uint8Array implements Converter<string, Uint8Array> {
  async convert(src: string, options: ConvertOptions): Promise<Uint8Array> {
    const dstTextEncoding = options.dstTextEncoding || "utf8";
    if (hasBuffer && 0 <= BUFFER_ENCODINGS.indexOf(dstTextEncoding)) {
      // eslint-disable-next-line
      return Buffer.from(src, dstTextEncoding as any);
    }

    if (dstTextEncoding === "utf8") {
      return getTextEncoder().encode(src);
    }

    if (dstTextEncoding === "utf16le") {
      const ab = new ArrayBuffer(src.length * 2);
      const u16 = new Uint16Array(ab);
      for (let i = 0, strLen = src.length; i < strLen; i++) {
        u16[i] = src.charCodeAt(i);
      }
      return new Uint8Array(ab);
    }

    if (0 <= EJ_ENCODINGS.indexOf(dstTextEncoding)) {
      const ej = await getEncodingJapanese();
      if (ej) {
        const opts: ConvertArrayBufferOptions = {
          to: dstTextEncoding.toUpperCase() as Encoding,
          type: "arraybuffer",
        };
        const ab = ej.convert(src, opts);
        return new Uint8Array(ab);
      }
    }

    const iconv = await getIconv();
    if (iconv) {
      if (iconv.encodingExists(dstTextEncoding)) {
        return iconv.encode(src, dstTextEncoding);
      }
    }

    throw new Error("Not supported dstTextEncoding: " + dstTextEncoding);
  }
}

export default new String_Uint8Array();
