import { encode } from "base64-arraybuffer";
import { AbstractConverter, C } from "./AbstractConverter";
import {
  ConvertOptions,
  Data,
  DataType,
  getStartEnd,
  hasNoStartLength,
} from "./core";
import {
  handleFileReader,
  hasReadAsBinaryStringOnBlob,
  isNode,
} from "./NodeUtil";
import { getTextHelper } from "./StringUtil";

export class BinaryConverter extends AbstractConverter<string> {
  public type: DataType = "binary";

  public empty(): string {
    return "";
  }

  public is(input: unknown, options: ConvertOptions): input is string {
    return typeof input === "string" && options.srcStringType === "binary";
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<string | undefined> {
    if (typeof input === "string" && options.srcStringType === "binary") {
      if (hasNoStartLength(options)) {
        return input;
      }
      const { start, end } = await this._getStartEnd(input, options);
      return input.substring(start, end);
    }

    if (C().is("blob", input, options) && hasReadAsBinaryStringOnBlob) {
      const startEnd = getStartEnd(options, input.size);
      let start = startEnd.start;
      const end = startEnd.end as number;

      const bufferSize = options.bufferSize;
      const chunks: string[] = [];
      for (; start < end; start += bufferSize) {
        const blobChunk = input.slice(start, start + bufferSize);
        const chunk: string = await handleFileReader(
          (reader) => reader.readAsBinaryString(blobChunk),
          (data) => data as string
        );
        chunks.push(chunk);
      }
      return chunks.join("");
    }

    const u8 = await C().convert("uint8array", input, options);
    return Array.from(u8, (e) => String.fromCharCode(e)).join("");
  }

  protected _getSize(input: string): Promise<number> {
    return Promise.resolve(input.length);
  }

  protected _getStartEnd(
    input: string,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    return Promise.resolve(getStartEnd(options, input.length));
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
    return encode(u8);
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
    if (!hasNoStartLength(options)) {
      const startEnd = await this._getStartEnd(input, options);
      const start = startEnd.start;
      const end = startEnd.end as number;
      input = input.substring(start, end);
    }

    let u8: Uint8Array;
    if (isNode) {
      u8 = Buffer.from(input, "binary");
    } else {
      u8 = Uint8Array.from(input.split(""), (e) => e.charCodeAt(0));
    }
    return u8;
  }
}

export const INSTANCE = new BinaryConverter();
