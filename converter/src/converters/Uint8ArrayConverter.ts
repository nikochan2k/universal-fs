import { encode } from "base64-arraybuffer";
import { AbstractConverter, _ } from "./AbstractConverter";
import {
  ConvertOptions,
  Data,
  DataType,
  EMPTY_UINT8_ARRAY,
  getStartEnd,
  hasNoStartLength,
} from "./core.js";
import { hasBuffer, isBuffer, newBuffer, newBufferFrom } from "./Environment";
import { getTextHelper } from "./StringUtil.js";

export class Uint8ArrayConverter extends AbstractConverter<Uint8Array> {
  public type: DataType = "uint8array";

  public empty(): Uint8Array {
    return EMPTY_UINT8_ARRAY;
  }

  public is(input: unknown): input is Uint8Array {
    return input instanceof Uint8Array || isBuffer(input);
  }

  protected async _from(
    input: Data,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    if (hasBuffer && typeof input === "string") {
      const type = options.inputStringType;
      let buffer: Buffer | undefined;
      if (type === "base64") {
        buffer = Buffer.from(input, "base64");
      } else if (type === "binary") {
        buffer = Buffer.from(input, "binary");
      } else if (type === "hex") {
        buffer = Buffer.from(input, "hex");
      } else if (type === "text") {
        const textHelper = await getTextHelper();
        const u8 = await textHelper.textToBuffer(input, options);
        buffer = u8 as Buffer;
      }
      if (buffer) {
        const { start, end } = await this._getStartEnd(buffer, options);
        return buffer.subarray(start, end);
      }
      // 'type === "url"' is handled by arrayBufferConverter().convert();
    }

    const ab = await _().convert("arraybuffer", input, options);
    return newBufferFrom(ab);
  }

  protected _getStartEnd(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    return Promise.resolve(getStartEnd(options, input.byteLength));
  }

  protected _isEmpty(input: Uint8Array): boolean {
    return input.byteLength === 0;
  }

  protected _merge(chunks: Uint8Array[]): Promise<Uint8Array> {
    if (hasBuffer) {
      return Promise.resolve(Buffer.concat(chunks));
    }

    const byteLength = chunks.reduce((sum, chunk) => {
      return sum + chunk.byteLength;
    }, 0);
    const u8 = newBuffer(byteLength);
    let pos = 0;
    for (const chunk of chunks) {
      u8.set(chunk, pos);
      pos += chunk.byteLength;
    }
    return Promise.resolve(u8);
  }

  protected _size(input: Uint8Array): Promise<number> {
    return Promise.resolve(input.byteLength);
  }

  protected async _toArrayBuffer(
    input: Uint8Array,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const u8 = await this._toUint8Array(input, options);
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  }

  protected async _toBase64(
    input: Uint8Array,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this._toUint8Array(input, options);
    return encode(u8);
  }

  protected async _toText(
    input: Uint8Array,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this._toUint8Array(input, options);
    const textHelper = await getTextHelper();
    return await textHelper.bufferToText(u8, options);
  }

  protected async _toUint8Array(
    input: Uint8Array,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    if (hasNoStartLength(options)) {
      return input;
    }
    const { start, end } = await this._getStartEnd(input, options);
    return input.subarray(start, end);
  }
}
