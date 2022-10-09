import { encode } from "base64-arraybuffer";
import { DEFAULT_CONVERTER } from "../converver";
import { getTextHelper } from "./converters";
import {
  AbstractConverter,
  ConvertOptions,
  Data,
  DataType,
  EMPTY_ARRAY_BUFFER,
  getStartEnd,
  hasNoStartLength,
} from "./core";
import { isNode } from "./util";

class ArrayBufferConverter extends AbstractConverter<ArrayBuffer> {
  public type: DataType = "arraybuffer";

  public empty(): ArrayBuffer {
    return EMPTY_ARRAY_BUFFER;
  }

  public is(input: unknown): input is ArrayBuffer {
    return (
      input instanceof ArrayBuffer ||
      toString.call(input) === "[object ArrayBuffer]"
    );
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<ArrayBuffer | undefined> {
    const converter = DEFAULT_CONVERTER.getConverter(input, options);
    return await converter.toArrayBuffer(input, options);
  }

  protected _getSize(input: ArrayBuffer): Promise<number> {
    return Promise.resolve(input.byteLength);
  }

  protected _getStartEnd(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    return Promise.resolve(getStartEnd(options, input.byteLength));
  }

  protected _isEmpty(input: ArrayBuffer): boolean {
    return input.byteLength === 0;
  }

  protected _merge(chunks: ArrayBuffer[]): Promise<ArrayBuffer> {
    const byteLength = chunks.reduce((sum, chunk) => {
      return sum + chunk.byteLength;
    }, 0);
    const u8 = new Uint8Array(byteLength);
    let pos = 0;
    for (const chunk of chunks) {
      u8.set(new Uint8Array(chunk), pos);
      pos += chunk.byteLength;
    }
    return Promise.resolve(
      u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
    );
  }

  protected async _toArrayBuffer(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    if (hasNoStartLength(options)) {
      return input;
    }
    const { start, end } = await this._getStartEnd(input, options);
    return input.slice(start, end);
  }

  protected async _toBase64(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    return encode(u8);
  }

  protected async _toText(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    const textHelper = await getTextHelper();
    return await textHelper.bufferToText(u8, options);
  }

  protected async _toUint8Array(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const ab = await this.toArrayBuffer(input, options);
    return isNode ? Buffer.from(ab) : new Uint8Array(ab);
  }
}

export const INSTANCE = new ArrayBufferConverter();
