import {
  arrayBufferConverter,
  readableStreamConverter,
  uint8ArrayConverter,
} from "./converters";
import {
  AbstractConverter,
  ConvertOptions,
  Data,
  getStartEnd,
  hasNoStartLength,
} from "./core";
import { textHelper } from "./TextHelper";
import {
  dataUrlToBase64,
  EMPTY_BLOB,
  handleFileReader,
  handleReadableStream,
  hasArrayBufferOnBlob,
  hasReadAsArrayBufferOnBlob,
  hasStreamOnBlob,
  hasTextOnBlob,
} from "./util";

class BlobConverter extends AbstractConverter<Blob> {
  public empty(): Blob {
    return EMPTY_BLOB;
  }

  public typeEquals(input: unknown): input is Blob {
    return (
      input instanceof Blob ||
      toString.call(input) === "[object Blob]" ||
      toString.call(input) === "[object File]"
    );
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<Blob | undefined> {
    if (this.typeEquals(input)) {
      if (hasNoStartLength(options)) {
        return input;
      }
      const { start, end } = await this._getStartEnd(input, options);
      return input.slice(start, end);
    }

    if (readableStreamConverter().typeEquals(input)) {
      const start = options.start ?? 0;
      const bufferSize = options.bufferSize;

      let index = 0;
      const chunks: Blob[] = [];
      await handleReadableStream(input, async (u8) => {
        const chunk = await this.convert(u8, { bufferSize });
        const size = chunk.size;
        const end = index + size;
        if (index < start) {
          chunks.push(chunk.slice(start, end));
        } else {
          chunks.push(chunk);
        }
        index += size;
        return true;
      });

      return await this.merge(chunks, options);
    }

    const u8 = await uint8ArrayConverter().convert(input, options);
    if (u8) {
      return new Blob([u8]);
    }

    return undefined;
  }

  protected _getSize(input: Blob): Promise<number> {
    return Promise.resolve(input.size);
  }

  protected _getStartEnd(
    input: Blob,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    return Promise.resolve(getStartEnd(options, input.size));
  }

  protected _isEmpty(input: Blob): boolean {
    return input.size === 0;
  }

  protected _merge(chunks: Blob[]): Promise<Blob> {
    return Promise.resolve(new Blob(chunks));
  }

  protected async _toArrayBuffer(
    input: Blob,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const u8 = await this.toUint8Array(input, options);
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  }

  protected async _toBase64(
    input: Blob,
    options: ConvertOptions
  ): Promise<string> {
    const startEnd = await this._getStartEnd(input, options);
    let start = startEnd.start;
    const end = startEnd.end as number;
    const chunks: string[] = [];
    const bufferSize = options.bufferSize;
    for (; start < end; start += bufferSize) {
      let e = start + bufferSize;
      if (end < e) e = end;
      const blobChunk = input.slice(start, e);
      const chunk = await handleFileReader(
        (reader) => reader.readAsDataURL(blobChunk),
        (data) => dataUrlToBase64(data as string)
      );
      chunks.push(chunk);
    }
    return chunks.join("");
  }

  protected async _toText(
    input: Blob,
    options: ConvertOptions
  ): Promise<string> {
    if (options.bufferToTextCharset === "utf8") {
      if (hasTextOnBlob) {
        return await input.text();
      }
      return await handleFileReader(
        (reader) => reader.readAsText(input),
        (data) => data as string
      );
    }
    const u8 = await this.toUint8Array(input, options);
    return await textHelper().bufferToText(u8, options.bufferToTextCharset);
  }

  protected async _toUint8Array(
    input: Blob,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    if (hasArrayBufferOnBlob) {
      const ab = await input.arrayBuffer();
      return await arrayBufferConverter().toUint8Array(ab, options);
    }

    const startEnd = await this._getStartEnd(input, options);
    let start = startEnd.start;
    const end = startEnd.end as number;

    const bufferSize = options.bufferSize;
    if (hasReadAsArrayBufferOnBlob) {
      const u8 = new Uint8Array(end - start);
      for (let index = 0; start < end; start += bufferSize) {
        let e = start + bufferSize;
        if (end < e) e = end;
        const blobChunk = input.slice(start, e);
        const chunk = await handleFileReader(
          (reader) => reader.readAsArrayBuffer(blobChunk),
          (data) => data as ArrayBuffer
        );
        u8.set(new Uint8Array(chunk), index);
        index += chunk.byteLength;
      }

      return u8;
    }
    if (hasStreamOnBlob) {
      const readable = input.stream() as unknown as ReadableStream<Uint8Array>;
      const chunks: Uint8Array[] = [];
      let index = 0;
      await handleReadableStream(readable, (u8) => {
        const size = u8.byteLength;
        if (start < index + size) {
          let e = index + size;
          if (end < e) e = end;
          if (index < start && start < e) {
            chunks.push(u8.slice(start, e));
          } else if (start <= index) {
            chunks.push(u8);
          }
        }
        index += size;
        return Promise.resolve(end == null || index < end);
      });
      return await uint8ArrayConverter().merge(chunks, options);
    }

    const base64 = await this.toBase64(input, options);
    return await uint8ArrayConverter().convert(base64);
  }
}

export const INSTANCE = new BlobConverter();
