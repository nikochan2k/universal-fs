import { encode } from "base64-arraybuffer";
import { AbstractConverter, _ } from "./AbstractConverter";
import {
  ConvertOptions,
  Data,
  DataType,
  EMPTY_ARRAY_BUFFER,
  getStartEnd,
  hasNoStartLength,
} from "./core";
import { hasBuffer, newBuffer, newBufferFrom } from "./Environment";
import { getTextHelper } from "./StringUtil";

const hasSharedArrayBuffer = typeof SharedArrayBuffer === "function";

export class ArrayBufferConverter extends AbstractConverter<ArrayBuffer> {
  public type: DataType = "arraybuffer";

  public empty(): ArrayBuffer {
    return EMPTY_ARRAY_BUFFER;
  }

  public is(input: unknown): input is ArrayBuffer {
    return (
      input instanceof ArrayBuffer ||
      (hasSharedArrayBuffer && input instanceof SharedArrayBuffer)
    );
  }

  protected async _from(
    input: Data,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const converter = _()._find(input, options);
    return await converter.toArrayBuffer(input, options);
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
    const u8 = newBuffer(byteLength);
    let pos = 0;
    for (const chunk of chunks) {
      u8.set(newBufferFrom(chunk), pos);
      pos += chunk.byteLength;
    }
    return Promise.resolve(u8.buffer);
  }

  protected _size(input: ArrayBuffer): Promise<number> {
    return Promise.resolve(input.byteLength);
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
    const u8 = await this._toUint8Array(input, options);
    return encode(u8);
  }

  protected async _toText(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this._toUint8Array(input, options);
    const textHelper = await getTextHelper();
    return await textHelper.bufferToText(u8, options);
  }

  protected async _toUint8Array(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const ab = await this._toArrayBuffer(input, options);
    return hasBuffer ? Buffer.from(ab) : new Uint8Array(ab);
  }
}
