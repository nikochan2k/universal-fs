import { decode } from "base64-arraybuffer";
import {
  arrayBufferConverter,
  binaryConverter,
  blobConverter,
  bufferConverter,
  getTextHelper,
  hexConverter,
  readableConverter,
  readableStreamConverter,
  uint8ArrayConverter,
  urlConverter,
} from "./converters";
import {
  AbstractConverter,
  ConvertOptions,
  Data,
  DataType,
  deleteStartLength,
  getStartEnd,
  hasNoStartLength,
  Options,
} from "./core";
import { isBrowser, isNode } from "./util";

class Base64Converter extends AbstractConverter<string> {
  public type: DataType = "base64";

  public empty(): string {
    return "";
  }

  public typeEquals(input: unknown): input is string {
    return typeof input === "string";
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<string | undefined> {
    if (typeof input === "string") {
      const srcStringType = options.srcStringType;
      if (srcStringType === "base64") {
        return await this.toBase64(input, options);
      } else if (srcStringType === "binary") {
        return await binaryConverter().toBase64(input, options);
      } else if (srcStringType === "hex") {
        return await hexConverter().toBase64(input, options);
      } else if (srcStringType === "url") {
        return await urlConverter().toBase64(input, options);
      }
      const textHelper = await getTextHelper();
      input = await textHelper.textToBuffer(input, options.textToBufferCharset);
    }
    if (arrayBufferConverter().typeEquals(input)) {
      return await arrayBufferConverter().toBase64(input, options);
    }
    if (bufferConverter().typeEquals(input)) {
      return await bufferConverter().toBase64(input, options);
    }
    if (uint8ArrayConverter().typeEquals(input)) {
      return await uint8ArrayConverter().toBase64(input, options);
    }
    if (blobConverter().typeEquals(input)) {
      return await blobConverter().toBase64(input, options);
    }
    if (readableStreamConverter().typeEquals(input)) {
      return await readableStreamConverter().toBase64(input, options);
    }
    if (readableConverter().typeEquals(input)) {
      return await readableConverter().toBase64(input, options);
    }

    return undefined;
  }

  protected _getSize(input: string): Promise<number> {
    const len = input.length;
    const baseLen = (len * 3) / 4;
    let padding = 0;
    for (let i = len - 1; input[i] === "="; i--) {
      padding++;
    }
    const size = baseLen - padding;
    return Promise.resolve(size);
  }

  protected async _getStartEnd(
    input: string,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    const size = await this.getSize(input);
    return getStartEnd(options, size);
  }

  protected _isEmpty(input: string): boolean {
    return !input;
  }

  protected async _merge(chunks: string[], options: Options): Promise<string> {
    if (isBrowser) {
      const converter = blobConverter();
      const blobs: Blob[] = [];
      for (const chunk of chunks) {
        blobs.push(await converter.convert(chunk, options));
      }
      const blob = await converter.merge(blobs, options);
      return await this.convert(blob);
    } else {
      const buffers: Uint8Array[] = [];
      for (const chunk of chunks) {
        buffers.push(await this.toUint8Array(chunk, options));
      }
      const u8 = await uint8ArrayConverter().merge(buffers, options);
      return await this.convert(u8);
    }
  }

  protected async _toArrayBuffer(
    input: string,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const ab = decode(input);
    if (hasNoStartLength(options)) {
      return Promise.resolve(ab);
    }
    const { start, end } = await this._getStartEnd(input, options);
    return ab.slice(start, end);
  }

  protected async _toBase64(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    if (hasNoStartLength(options)) {
      return input;
    }
    const u8 = await this.toUint8Array(input, options);
    return await this.convert(u8, deleteStartLength(options));
  }

  protected async _toText(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    const textHelper = await getTextHelper();
    return await textHelper.bufferToText(u8, options.bufferToTextCharset);
  }

  protected async _toUint8Array(
    input: string,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const ab = await this.toArrayBuffer(input, options);
    return isNode ? Buffer.from(ab) : new Uint8Array(ab);
  }
}

export const INSTANCE = new Base64Converter();
