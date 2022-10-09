import { encode } from "base64-arraybuffer";
import { DEFAULT_CONVERTER } from "../AnyConv";
import {
  AbstractConverter,
  ConvertOptions,
  Data,
  DataType,
  EMPTY_UINT8_ARRAY,
  getStartEnd,
  hasNoStartLength,
} from "./core";
import { getTextHelper, isNode } from "./util";

export class Uint8ArrayConverter extends AbstractConverter<Uint8Array> {
  public type: DataType = "uint8array";

  public empty(): Uint8Array {
    return EMPTY_UINT8_ARRAY;
  }

  public match(input: unknown, options: ConvertOptions): input is Uint8Array {
    if (DEFAULT_CONVERTER.converterOf("buffer").match(input, options)) {
      return true;
    }
    return input instanceof Uint8Array;
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<Uint8Array | undefined> {
    const converter = DEFAULT_CONVERTER.converter(input, options);
    return await converter.toUint8Array(input, options);
  }

  protected _getSize(input: Uint8Array): Promise<number> {
    return Promise.resolve(input.byteLength);
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

  protected async _merge(chunks: Uint8Array[]): Promise<Uint8Array> {
    const byteLength = chunks.reduce((sum, chunk) => {
      return sum + chunk.byteLength;
    }, 0);

    const u8 = isNode ? Buffer.alloc(byteLength) : new Uint8Array(byteLength);
    let pos = 0;
    for (const chunk of chunks) {
      u8.set(chunk, pos);
      pos += chunk.byteLength;
    }
    return Promise.resolve(u8);
  }

  protected async _toArrayBuffer(
    input: Uint8Array,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const u8 = await this.toUint8Array(input, options);
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  }

  protected async _toBase64(
    input: Uint8Array,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    return encode(u8);
  }

  protected async _toText(
    input: Uint8Array,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
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
    return input.slice(start, end);
  }
}

export const INSTANCE = new Uint8ArrayConverter();
