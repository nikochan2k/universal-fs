import {
  arrayBufferConverter,
  getTextHelper,
  readableConverter,
  readableStreamConverter,
  uint8ArrayConverter,
} from "./converters";
import {
  AbstractConverter,
  ConvertOptions,
  Data,
  DataType,
  getStartEnd,
  hasNoStartLength,
} from "./core";
import { EMPTY_BUFFER } from "./util";

class BufferConverter extends AbstractConverter<Buffer> {
  public type: DataType = "buffer";

  public empty(): Buffer {
    return EMPTY_BUFFER;
  }

  public typeEquals(input: unknown): input is Buffer {
    return (
      input instanceof Buffer || toString.call(input) === "[object Buffer]"
    );
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<Buffer | undefined> {
    if (this.typeEquals(input)) {
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
        const u8 = await textHelper.textToBuffer(
          input,
          options.textToBufferCharset
        );
        buffer = u8 as Buffer;
      }
      if (buffer) {
        const { start, end } = await this._getStartEnd(buffer, options);
        return buffer.slice(start, end);
      }
      // 'type === "url"' is handled by arrayBufferConverter().convert();
    }
    if (uint8ArrayConverter().typeEquals(input)) {
      return Buffer.from(
        input.buffer.slice(
          input.byteOffset,
          input.byteOffset + input.byteLength
        )
      );
    }
    if (readableConverter().typeEquals(input)) {
      const u8 = await readableConverter().toUint8Array(input, options);
      return Buffer.from(
        u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
      );
    }
    if (readableStreamConverter().typeEquals(input)) {
      const u8 = await readableStreamConverter().toUint8Array(input, options);
      return Buffer.from(
        u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
      );
    }

    const ab = await arrayBufferConverter().convert(input, options);
    if (ab) {
      return Buffer.from(ab);
    }

    return undefined;
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
    return await textHelper.bufferToText(buffer, options.bufferToTextCharset);
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
