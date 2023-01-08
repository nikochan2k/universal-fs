import type {
  convert,
  ConvertArrayBufferOptions,
  Encoding,
} from "encoding-japanese";
import type * as iconv from "iconv-lite";
import { Converter, ConvertOptions } from "../../core.js";
import { hasBuffer } from "../../supports/Environment.js";

const BUFFER_ENCODINGS = ["ascii", "utf8", "utf16le", "ucs2", "latin1"];
const EJ_ENCODINGS = ["utf32", "utf16be", "jis", "eucjp", "sjis"];

class String_Uint8Array implements Converter<string, Uint8Array> {
  private _encoder?: TextEncoder;
  private _convert?: typeof convert | null;
  private _iconv?: typeof iconv | null;

  async convert(src: string, options: ConvertOptions): Promise<Uint8Array> {
    const dstTextEncoding = options.dstTextEncoding ?? "utf8";
    if (hasBuffer && 0 <= BUFFER_ENCODINGS.indexOf(dstTextEncoding)) {
      // eslint-disable-next-line
      return Buffer.from(src, dstTextEncoding as any);
    }

    if (dstTextEncoding === "utf8") {
      if (!this._encoder) {
        this._encoder = new TextEncoder();
      }
      return this._encoder.encode(src);
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
      if (typeof this._convert === "undefined") {
        try {
          this._convert = (await import("encoding-japanese")).convert;
        } catch {
          this._convert = null;
        }
      }
      if (this._convert) {
        const opts: ConvertArrayBufferOptions = {
          to: dstTextEncoding.toUpperCase() as Encoding,
          type: "arraybuffer",
        };
        const ab = this._convert(src, opts);
        return new Uint8Array(ab);
      }
    }

    if (typeof this._iconv === "undefined") {
      try {
        this._iconv = await import("iconv-lite");
      } catch {
        this._iconv = null;
      }
    }
    if (this._iconv) {
      if (this._iconv.encodingExists(dstTextEncoding)) {
        return this._iconv.encode(src, dstTextEncoding);
      }
    }

    throw new Error("Not supported encoding: " + dstTextEncoding);
  }
}

export default new String_Uint8Array();
