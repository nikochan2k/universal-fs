import { decode } from "base64-arraybuffer";
import { DEFAULT_CONVERTER } from "../converver";
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
import { getTextHelper, isBrowser, isNode } from "./util";

export class Base64Converter extends AbstractConverter<string> {
  public type: DataType = "base64";

  public empty(): string {
    return "";
  }

  public match(input: unknown, options: ConvertOptions): input is string {
    return typeof input === "string" && options.srcStringType === "base64";
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<string | undefined> {
    const converter = DEFAULT_CONVERTER.getConverter(input, options);
    return await converter.toBase64(input, options);
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
      const converter = DEFAULT_CONVERTER.of("blob");
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
      const u8 = await DEFAULT_CONVERTER.of("uint8array").merge(
        buffers,
        options
      );
      return await this.convert(u8);
    }
  }

  protected async _toArrayBuffer(
    input: string,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const ab = decode(input);
    if (hasNoStartLength(options)) {
      return ab;
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
    return await textHelper.bufferToText(u8, options);
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
