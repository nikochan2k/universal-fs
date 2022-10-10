import { _, AbstractConverter } from "./AbstractConverter";
import {
  ConvertOptions,
  Data,
  DataType,
  deleteStartLength,
  getStartEnd,
  hasNoStartLength,
  Options,
} from "./core";
import { getTextHelper } from "./StringUtil";

export class TextConverter extends AbstractConverter<string> {
  public type: DataType = "text";

  public empty(): string {
    return "";
  }

  public is(input: unknown, options: ConvertOptions): input is string {
    return typeof input === "string" && options.srcStringType === "text";
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<string> {
    const converter = _()._find(input, options);
    return await converter.toText(input, options);
  }

  protected async _getStartEnd(
    input: string,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    const size = await this.size(input, options);
    return getStartEnd(options, size);
  }

  protected _isEmpty(input: string): boolean {
    return !input;
  }

  protected _merge(chunks: string[]): Promise<string> {
    return Promise.resolve(chunks.join(""));
  }

  protected async _size(input: string, options: Options): Promise<number> {
    const u8 = await this.toUint8Array(input, deleteStartLength(options));
    return u8.byteLength;
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
    return await _()._of("uint8array").toBase64(u8, deleteStartLength(options));
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
    return await textHelper.textToBuffer(input, options);
  }
}

export const INSTANCE = new TextConverter();
