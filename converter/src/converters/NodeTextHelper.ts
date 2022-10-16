import type { decode, encode } from "iconv-lite";
import { _ } from "./AbstractConverter";
import { Charset } from "./core";
import { isBuffer } from "./Environment";
import { TextHelper } from "./TextHelper";

export class NodeTextHelper extends TextHelper {
  private _decode: typeof decode | undefined | null;
  private _encode: typeof encode | undefined | null;

  public override async _textToBuffer(
    text: string,
    bufCharset: Charset
  ): Promise<Uint8Array | null> {
    if (bufCharset === "utf8" || bufCharset === "utf16le") {
      return Buffer.from(text, bufCharset as BufferEncoding);
    }
    return await super._textToBuffer(text, bufCharset);
  }

  protected override async _bufferToText(
    buf: Uint8Array,
    bufCharset: Charset
  ): Promise<string | null> {
    let buffer: Buffer;
    if (isBuffer(buf)) {
      buffer = buf;
    } else {
      buffer = (await _().convert("uint8array", buf)) as Buffer;
    }
    if (bufCharset === "utf8" || bufCharset === "utf16le") {
      return buffer.toString(bufCharset as BufferEncoding);
    }
    return await super._bufferToText(buf, bufCharset);
  }

  protected async decode(u8: Uint8Array, encoding: string) {
    if (typeof this._decode === "undefined") {
      try {
        this._decode = (await import("iconv-lite")).decode;
      } catch {
        this._decode = null;
      }
    }

    if (!this._decode) {
      return null;
    }

    let buffer: Buffer;
    if (isBuffer(u8)) {
      buffer = u8;
    } else {
      buffer = Buffer.from(u8);
    }
    return this._decode(buffer, encoding);
  }

  protected async encode(content: string, encoding: string) {
    if (typeof this._encode === "undefined") {
      try {
        this._encode = (await import("iconv-lite")).encode;
      } catch {
        this._encode = null;
      }
    }

    if (!this._encode) {
      return null;
    }

    return this._encode(content, encoding);
  }
}
