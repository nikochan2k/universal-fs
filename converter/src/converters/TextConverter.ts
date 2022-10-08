import {
  arrayBufferConverter,
  base64Converter,
  binaryConverter,
  blobConverter,
  bufferConverter,
  getTextHelper,
  hexConverter,
  readableConverter,
  readableStreamConverter,
  uint8ArrayConverter,
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

class TextConverter extends AbstractConverter<string> {
  public type: DataType = "text";

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
        return await base64Converter().toText(input, options);
      } else if (srcStringType === "binary") {
        return await binaryConverter().toText(input, options);
      } else if (srcStringType === "hex") {
        return await hexConverter().toText(input, options);
      } else if (srcStringType === "url") {
        input = await uint8ArrayConverter().convert(
          input,
          deleteStartLength(options)
        );
      } else {
        return await this.toText(input, options);
      }
    }
    if (arrayBufferConverter().typeEquals(input, options)) {
      return await arrayBufferConverter().toText(input, options);
    }
    if (bufferConverter().typeEquals(input, options)) {
      return await bufferConverter().toText(input, options);
    }
    if (uint8ArrayConverter().typeEquals(input, options)) {
      return await uint8ArrayConverter().toText(input, options);
    }
    if (blobConverter().typeEquals(input, options)) {
      return await blobConverter().toText(input, options);
    }
    if (readableConverter().typeEquals(input, options)) {
      return await readableConverter().toText(input, options);
    }
    if (readableStreamConverter().typeEquals(input, options)) {
      return await readableStreamConverter().toText(input, options);
    }

    return undefined;
  }

  protected async _getSize(input: string, options: Options): Promise<number> {
    const u8 = await this.toUint8Array(input, deleteStartLength(options));
    return u8.byteLength;
  }

  protected async _getStartEnd(
    input: string,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    const size = await this.getSize(input, options);
    return getStartEnd(options, size);
  }

  protected _isEmpty(input: string): boolean {
    return !input;
  }

  protected _merge(chunks: string[]): Promise<string> {
    return Promise.resolve(chunks.join(""));
  }

  protected async _toArrayBuffer(
    input: string,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const u8 = await this.toUint8Array(input, options);
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  }

  protected async _toBase64(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    return await uint8ArrayConverter().toBase64(u8, deleteStartLength(options));
  }

  protected async _toText(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    if (
      options.bufferToTextCharset === options.textToBufferCharset &&
      hasNoStartLength(options)
    ) {
      return input;
    }
    const u8 = await this.toUint8Array(input, options);
    const textHelper = await getTextHelper();
    return await textHelper.bufferToText(u8, options);
  }

  protected async _toUint8Array(
    input: string,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const textHelper = await getTextHelper();
    const u8 = await textHelper.textToBuffer(input, options);
    return await uint8ArrayConverter().toUint8Array(u8, options);
  }
}

export const INSTANCE = new TextConverter();
