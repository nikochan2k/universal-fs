import { decode } from "base64-arraybuffer";
import { AbstractConverter, _ } from "./AbstractConverter";
import {
  ConvertOptions,
  Data,
  DataType,
  deleteStartLength,
  getStartEnd,
  hasNoStartLength,
  Options,
} from "./core.js";
import { isBrowser, newBufferFrom } from "./Environment";
import { getTextHelper } from "./StringUtil.js";

export class Base64Converter extends AbstractConverter<string> {
  public type: DataType = "base64";

  public empty(): string {
    return "";
  }

  public is(input: unknown, options: ConvertOptions): input is string {
    return typeof input === "string" && options.inputStringType === "base64";
  }

  protected async _from(input: Data, options: ConvertOptions): Promise<string> {
    const univConv = _()._find(input, options);
    return await univConv.toBase64(input, options);
  }

  protected async _getStartEnd(
    input: string,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    const size = await this.size(input);
    return getStartEnd(options, size);
  }

  protected _isEmpty(input: string): boolean {
    return !input;
  }

  protected async _merge(chunks: string[], options: Options): Promise<string> {
    if (isBrowser) {
      const blob = await _().merge("blob", chunks, options);
      return await this.from(blob);
    } else {
      const u8 = await _().merge("uint8array", chunks, options);
      return await this.from(u8);
    }
  }

  protected _size(input: string): Promise<number> {
    const len = input.length;
    const baseLen = (len * 3) / 4;
    let padding = 0;
    for (let i = len - 1; input[i] === "="; i--) {
      padding++;
    }
    const size = baseLen - padding;
    return Promise.resolve(size);
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
    const u8 = await this._toUint8Array(input, options);
    return await this._from(u8, deleteStartLength(options));
  }

  protected async _toText(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this._toUint8Array(input, options);
    const textHelper = await getTextHelper();
    return await textHelper.bufferToText(u8, options);
  }

  protected async _toUint8Array(
    input: string,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const ab = await this._toArrayBuffer(input, options);
    return newBufferFrom(ab);
  }
}
