import { DEFAULT_CONVERTER } from "../AnyConv";
import { AbstractConverter } from "./AbstractConverter";
import {
  ConvertOptions,
  Data,
  DataType,
  getStartEnd,
  hasNoStartLength,
} from "./core";
import { EMPTY_BUFFER, hasBuffer } from "./NodeUtil";
import { getTextHelper } from "./StringUtil";

export class BufferConverter extends AbstractConverter<Buffer> {
  public type: DataType = "buffer";

  public empty(): Buffer {
    return EMPTY_BUFFER;
  }

  public match(input: unknown): input is Buffer {
    return hasBuffer && input instanceof Buffer;
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<Buffer | undefined> {
    if (this.match(input)) {
      return await (this.toUint8Array(input, options) as Promise<Buffer>);
    }

    if (typeof input === "string") {
      const type = options.srcStringType;
      let buffer: Buffer | undefined;
      if (type === "base64") {
        buffer = Buffer.from(input, "base64");
      } else if (type === "binary") {
        buffer = Buffer.from(input, "binary");
      } else if (type === "hex") {
        buffer = Buffer.from(input, "hex");
      } else if (type === "text") {
        const textHelper = await getTextHelper();
        const u8 = await textHelper.textToBuffer(input, options);
        buffer = u8 as Buffer;
      }
      if (buffer) {
        const { start, end } = await this._getStartEnd(buffer, options);
        return buffer.slice(start, end);
      }
      // 'type === "url"' is handled by arrayBufferConverter().convert();
    }

    const ab = await DEFAULT_CONVERTER.converterOf("arraybuffer").convert(
      input,
      options
    );
    return Buffer.from(ab);
  }

  protected _getSize(input: Buffer): Promise<number> {
    return Promise.resolve(input.byteLength);
  }

  protected _getStartEnd(
    input: ArrayBuffer,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    return Promise.resolve(getStartEnd(options, input.byteLength));
  }

  protected _isEmpty(input: Buffer): boolean {
    return input.byteLength === 0;
  }

  protected _merge(chunks: Buffer[]): Promise<Buffer> {
    return Promise.resolve(Buffer.concat(chunks));
  }

  protected async _toArrayBuffer(
    input: Buffer,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const u8 = await this.toUint8Array(input, options);
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  }

  protected async _toBase64(
    input: Buffer,
    options: ConvertOptions
  ): Promise<string> {
    const buffer = (await this.toUint8Array(input, options)) as Buffer;
    return buffer.toString("base64");
  }

  protected async _toText(
    input: Buffer,
    options: ConvertOptions
  ): Promise<string> {
    const buffer = await this.toUint8Array(input, options);
    const textHelper = await getTextHelper();
    return await textHelper.bufferToText(buffer, options);
  }

  protected async _toUint8Array(
    input: Buffer,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    if (hasNoStartLength(options)) {
      return input;
    }
    const { start, end } = await this._getStartEnd(input, options);
    return input.slice(start, end);
  }
}

export const INSTANCE = new BufferConverter();
