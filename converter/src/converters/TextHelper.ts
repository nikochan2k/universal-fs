import type {
  convert,
  ConvertArrayBufferOptions,
  ConvertStringOptions,
} from "encoding-japanese";
import "fast-text-encoding";
import { ConvertOptions } from "./core.js";
import { newBufferFrom } from "./Environment";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export class TextHelper {
  private _convert: typeof convert | undefined | null;

  public async bufferToText(
    u8: Uint8Array,
    options: ConvertOptions
  ): Promise<string> {
    const encoding = options.bufferToTextEncoding;
    const converted = await this._bufferToText(u8, encoding);
    if (converted == null) {
      throw new Error(`Illegal encoding: ${encoding}`);
    }
    return converted;
  }

  public async textToBuffer(
    text: string,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const encoding = options.textToBufferEncoding;
    const converted = await this._textToBuffer(text, encoding);
    if (converted == null) {
      throw new Error(`Illegal encoding: ${encoding}`);
    }
    return converted;
  }

  protected async _bufferToText(
    u8: Uint8Array,
    encoding: string
  ): Promise<string | null> {
    if (encoding === "utf8") {
      return textDecoder.decode(u8);
    }
    if (encoding === "utf16le") {
      return String.fromCharCode.apply(null, Array.from(u8));
    }

    const converted = await this.convert(u8, {
      to: "UNICODE",
      from: encoding.toUpperCase(),
      type: "string",
    } as ConvertStringOptions);
    return converted;
  }

  protected async _textToBuffer(
    text: string,
    encoding: string
  ): Promise<Uint8Array | null> {
    if (encoding === "utf8") {
      return textEncoder.encode(text);
    }
    if (encoding === "utf16le") {
      const ab = this.textToUtf16leBuffer(text);
      return newBufferFrom(ab);
    }

    const ab = await this.convert(text, {
      to: encoding.toUpperCase(),
      from: "UNICODE",
      type: "arraybuffer",
    } as ConvertArrayBufferOptions);
    if (ab == null) {
      return null;
    }
    return newBufferFrom(ab);
  }

  protected async convert(
    data: Uint8Array,
    options: ConvertStringOptions
  ): Promise<string | null>;
  protected async convert(
    data: string,
    options: ConvertArrayBufferOptions
  ): Promise<ArrayBuffer | null>;
  protected async convert(
    data: Uint8Array | string,
    options: ConvertStringOptions | ConvertArrayBufferOptions
  ): Promise<ArrayBuffer | string | null> {
    if (typeof this._convert === "undefined") {
      try {
        this._convert = (await import("encoding-japanese")).convert;
      } catch {
        this._convert = null;
      }
    }

    if (!this._convert) {
      return null;
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
