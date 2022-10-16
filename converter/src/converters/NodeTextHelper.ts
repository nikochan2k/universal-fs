import { decode, encode, encodingExists } from "iconv-lite";
import { _ } from "./AbstractConverter";
import { isBuffer } from "./Environment";
import { TextHelper } from "./TextHelper";

const encodings = ["latin1", "ascii", "utf8", "ucs2", "ucs-2", "utf16le"];

export class NodeTextHelper extends TextHelper {
  private _decode: typeof decode | undefined | null;
  private _encode: typeof encode | undefined | null;
  private _encodingExists: typeof encodingExists | undefined | null;

  protected override async _bufferToText(
    buf: Uint8Array,
    encoding: string
  ): Promise<string | null> {
    let buffer: Buffer;
    if (isBuffer(buf)) {
      buffer = buf;
    } else {
      buffer = (await _().convert("uint8array", buf)) as Buffer;
    }
    if (0 <= encodings.indexOf(encoding.toLowerCase())) {
      return buffer.toString(encoding as BufferEncoding);
    }
    const converted = await this.decode(buffer, encoding);
    if (converted) return converted;
    return await super._bufferToText(buf, encoding);
  }

  protected override async _textToBuffer(
    text: string,
    encoding: string
  ): Promise<Uint8Array | null> {
    if (0 <= encodings.indexOf(encoding.toLowerCase())) {
      return Buffer.from(text, encoding as BufferEncoding);
    }
    const converted = await this.encode(text, encoding);
    if (converted) return converted;
    return await super._textToBuffer(text, encoding);
  }

  protected async decode(u8: Uint8Array, encoding: string) {
    if (!(await this.encodingExists(encoding))) {
      return null;
    }

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
    if (!(await this.encodingExists(encoding))) {
      return null;
    }

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

  protected async encodingExists(encoding: string) {
    if (typeof this._encodingExists === "undefined") {
      try {
        this._encodingExists = (await import("iconv-lite")).encodingExists;
      } catch {
        this._encodingExists = null;
      }
    }

    if (!this._encodingExists) {
      return false;
    }

    return this._encodingExists(encoding);
  }
}
