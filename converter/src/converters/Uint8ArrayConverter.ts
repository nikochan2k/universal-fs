import { encode } from "base64-arraybuffer";
import {
  arrayBufferConverter,
  base64Converter,
  binaryConverter,
  blobConverter,
  bufferConverter,
  hexConverter,
  readableConverter,
  readableStreamConverter,
  urlConverter,
} from "./converters";
import {
  AbstractConverter,
  ConvertOptions,
  Data,
  EMPTY_UINT8_ARRAY,
  getStartEnd,
  hasNoStartLength,
} from "./core";
import { textHelper } from "./TextHelper";
import { isNode } from "./util";
class Uint8ArrayConverter extends AbstractConverter<Uint8Array> {
  public empty(): Uint8Array {
    return EMPTY_UINT8_ARRAY;
  }

  public typeEquals(input: unknown): input is Uint8Array {
    return (
      bufferConverter().typeEquals(input) ||
      input instanceof Uint8Array ||
      toString.call(input) === "[object Uint8Array]"
    );
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<Uint8Array | undefined> {
    if (this.typeEquals(input)) {
      return await this.toUint8Array(input, options);
    }

    if (typeof input === "string") {
      const srcStringType = options.srcStringType;
      if (srcStringType === "base64") {
        return await base64Converter().toUint8Array(input, options);
      } else if (srcStringType === "binary") {
        return await binaryConverter().toUint8Array(input, options);
      } else if (srcStringType === "hex") {
        return await hexConverter().toUint8Array(input, options);
      } else if (srcStringType === "url") {
        return await urlConverter().toUint8Array(input, options);
      }
      const u8 = await textHelper().textToBuffer(
        input,
        options.textToBufferCharset
      );
      return this.toUint8Array(u8, options);
    }
    if (arrayBufferConverter().typeEquals(input)) {
      return await arrayBufferConverter().toUint8Array(input, options);
    }
    if (blobConverter().typeEquals(input)) {
      return await blobConverter().toUint8Array(input, options);
    }
    if (readableStreamConverter().typeEquals(input)) {
      return await readableStreamConverter().toUint8Array(input, options);
    }
    if (readableConverter().typeEquals(input)) {
      return await readableConverter().toUint8Array(input, options);
    }

    return undefined;
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
    return await textHelper().bufferToText(u8, options.bufferToTextCharset);
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
