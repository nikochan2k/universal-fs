import type {
  convert,
  ConvertArrayBufferOptions,
  ConvertStringOptions,
} from "encoding-japanese";
import "fast-text-encoding";
import { Charset } from "./core";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export class TextHelper {
  private _convert: typeof convert | undefined | null;

  public async bufferToText(
    u8: Uint8Array,
    bufCharset: Charset
  ): Promise<string> {
    if (bufCharset === "utf8") {
      return textDecoder.decode(u8);
    }
    if (bufCharset === "utf16le") {
      return String.fromCharCode.apply(null, Array.from(u8));
    }

    return await this.convert(u8, {
      to: "UNICODE",
      from: bufCharset.toUpperCase(),
      type: "string",
    } as ConvertStringOptions);
  }

  public async textToBuffer(
    text: string,
    bufCharset: Charset
  ): Promise<Uint8Array> {
    if (bufCharset === "utf8") {
      return textEncoder.encode(text);
    }
    if (bufCharset === "utf16le") {
      const ab = this.textToUtf16leBuffer(text);
      return new Uint8Array(ab);
    }

    const ab = await this.convert(text, {
      to: bufCharset.toUpperCase(),
      from: "UNICODE",
      type: "arraybuffer",
    } as ConvertArrayBufferOptions);
    return new Uint8Array(ab);
  }

  protected async convert(
    data: Uint8Array,
    options: ConvertStringOptions
  ): Promise<string>;
  protected async convert(
    data: string,
    options: ConvertArrayBufferOptions
  ): Promise<ArrayBuffer>;
  protected async convert(
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
      return this.convert(data, options as ConvertArrayBufferOptions);
    } else {
      return this.convert(data, options as ConvertStringOptions);
    }
  }

  protected textToUtf16leBuffer(text: string) {
    const ab = new ArrayBuffer(text.length * 2);
    const u16 = new Uint16Array(ab);
    for (let i = 0, strLen = text.length; i < strLen; i++) {
      u16[i] = text.charCodeAt(i);
    }
    return ab;
  }
}

export const TEXT_HELPER = new TextHelper();
