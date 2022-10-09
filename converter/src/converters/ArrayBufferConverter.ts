import { encode } from "base64-arraybuffer";
import { _, AbstractConverter } from "./AbstractConverter";
import {
  ConvertOptions,
  Data,
  DataType,
  EMPTY_ARRAY_BUFFER,
  getStartEnd,
  hasNoStartLength,
} from "./core";
import { isNode } from "./NodeUtil";
import { getTextHelper } from "./StringUtil";

const hasSharedArrayBuffer = typeof SharedArrayBuffer === "function";

export class ArrayBufferConverter extends AbstractConverter<ArrayBufferLike> {
  public type: DataType = "arraybuffer";

  public empty(): ArrayBufferLike {
    return EMPTY_ARRAY_BUFFER;
  }

  public is(input: unknown): input is ArrayBufferLike {
    return (
      input instanceof ArrayBuffer ||
      (hasSharedArrayBuffer && input instanceof SharedArrayBuffer)
    );
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<ArrayBufferLike | undefined> {
    const converter = _()._find(input, options);
    return await converter.toArrayBuffer(input, options);
  }

  protected _size(input: ArrayBufferLike): Promise<number> {
    return Promise.resolve(input.byteLength);
  }

  protected _getStartEnd(
    input: ArrayBufferLike,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    return Promise.resolve(getStartEnd(options, input.byteLength));
  }

  protected _isEmpty(input: ArrayBufferLike): boolean {
    return input.byteLength === 0;
  }

  protected _merge(chunks: ArrayBufferLike[]): Promise<ArrayBufferLike> {
    const byteLength = chunks.reduce((sum, chunk) => {
      return sum + chunk.byteLength;
    }, 0);
    const u8 = new Uint8Array(byteLength);
    let pos = 0;
    for (const chunk of chunks) {
      u8.set(new Uint8Array(chunk), pos);
      pos += chunk.byteLength;
    }
    return Promise.resolve(u8.buffer);
  }

  protected async _toArrayBuffer(
    input: ArrayBufferLike,
    options: ConvertOptions
  ): Promise<ArrayBufferLike> {
    if (hasNoStartLength(options)) {
      return input;
    }
    const { start, end } = await this._getStartEnd(input, options);
    return input.slice(start, end);
  }

  protected async _toBase64(
    input: ArrayBufferLike,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    return encode(u8);
  }

  protected async _toText(
    input: ArrayBufferLike,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    const textHelper = await getTextHelper();
    return await textHelper.bufferToText(u8, options);
  }

  protected async _toUint8Array(
    input: ArrayBufferLike,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const ab = await this.toArrayBuffer(input, options);
    return isNode ? Buffer.from(ab) : new Uint8Array(ab);
  }
}

export const INSTANCE = new ArrayBufferConverter();
