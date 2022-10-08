import {
  convert,
  ConvertArrayBufferOptions,
  ConvertStringOptions,
} from "encoding-japanese";
import "fast-text-encoding";
import { Charset } from "./core";
import { TextHelper } from "./TextHelper";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function textToUtf16leBuffer(text: string) {
  const ab = new ArrayBuffer(text.length * 2);
  const u16 = new Uint16Array(ab);
  for (let i = 0, strLen = text.length; i < strLen; i++) {
    u16[i] = text.charCodeAt(i);
  }
  return ab;
}
export class DefaultTextHelper implements TextHelper {
  _convert: typeof convert | undefined | null;

  private async convert(
    data: Uint8Array,
    options: ConvertStringOptions
  ): Promise<string>;
  private async convert(
    data: string,
    options: ConvertArrayBufferOptions
  ): Promise<ArrayBuffer>;
  private async convert(
    data: Uint8Array | string,
    options: ConvertStringOptions | ConvertArrayBufferOptions
  ): Promise<ArrayBuffer | string> {
    if (typeof this._convert === "undefined") {
      try {
        this._convert = (await import("encoding-japanese")).convert;
      } catch {
        this._convert = null;
      }
    }

    if (!this._convert) {
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Illegal encoding: from=${options.from}, to=${options.to}`
      );
    }

    if (typeof data === "string") {
      return convert(data, options as ConvertArrayBufferOptions);
    } else {
      return convert(data, options as ConvertStringOptions);
    }
  }

  async bufferToText(u8: Uint8Array, bufCharset: Charset): Promise<string> {
    if (bufCharset === "utf8") {
      return Promise.resolve(textDecoder.decode(u8));
    }
    if (bufCharset === "utf16le") {
      return Promise.resolve(String.fromCharCode.apply(null, Array.from(u8)));
    }

    return this.convert(u8, {
      to: "UNICODE",
      from: bufCharset.toUpperCase(),
      type: "string",
    } as ConvertStringOptions);
  }

  async textToBuffer(text: string, bufCharset: Charset): Promise<Uint8Array> {
    if (bufCharset === "utf8") {
      return Promise.resolve(textEncoder.encode(text));
    }
    if (bufCharset === "utf16le") {
      const ab = textToUtf16leBuffer(text);
      return Promise.resolve(new Uint8Array(ab));
    }

    const ab = await this.convert(text, {
      to: bufCharset.toUpperCase(),
      from: "UNICODE",
      type: "arraybuffer",
    } as ConvertArrayBufferOptions);
    return Promise.resolve(new Uint8Array(ab));
  }
}

export const DEFAULT_TEXT_HELPER = new DefaultTextHelper();
