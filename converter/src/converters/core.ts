import type { Readable } from "stream";
import { hasBlob, isBrowser, isNode } from "./util";

export type Charset = "utf8" | "utf16le" | "utf16be" | "jis" | "eucjp" | "sjis";
export type URLType = "file" | "data" | "blob";
export type StringType = "text" | "url" | "base64" | "binary" | "hex";
export type BinaryType = "arraybuffer" | "uint8array" | "buffer" | "blob";
export type BlockType = StringType | BinaryType;
export type StreamType = "readable" | "readablestream";
export type DataType = BlockType | StreamType | "unknown";

export type BlockData = string | ArrayBuffer | Uint8Array | Buffer | Blob;
export type StreamData = Readable | ReadableStream<Uint8Array>;
export type Data = BlockData | StreamData;

export interface Options {
  bufferSize: number;
  bufferToTextCharset: Charset;
  dstURLType: URLType;
  srcStringType: StringType;
  textToBufferCharset: Charset;
}
export interface ConvertOptions extends Options {
  length?: number;
  start?: number;
}

export interface Converter<T extends Data> {
  type: DataType;

  convert(input: Data, options?: Partial<ConvertOptions>): Promise<T>;
  empty(): T;
  getSize(input: T, options?: Partial<Options>): Promise<number>;
  match(input: unknown, options?: Partial<ConvertOptions>): input is T;
  merge(chunks: T[], options?: Partial<Options>): Promise<T>;
  toArrayBuffer(input: T, options: ConvertOptions): Promise<ArrayBuffer>;
  toBase64(input: T, options: ConvertOptions): Promise<string>;
  toText(input: T, options: ConvertOptions): Promise<string>;
  toUint8Array(input: T, options: ConvertOptions): Promise<Uint8Array>;
}

export function getType(input: unknown): string {
  const type = typeof input;
  if (type === "function" || type === "object") {
    // eslint-disable-next-line
    return (input as any)?.constructor?.name || String.toString.call(input);
  }
  return type;
}

export const DEFAULT_BUFFER_SIZE = 96 * 1024;
export const EMPTY_ARRAY_BUFFER = new ArrayBuffer(0);
export const EMPTY_UINT8_ARRAY = new Uint8Array(0);

export function getStartEnd(
  options: ConvertOptions,
  size?: number
): { start: number; end: number | undefined } {
  let start = options.start ?? 0;
  if (size != null && size < start) {
    start = size;
  }
  let end: number | undefined;
  if (options.length == null) {
    if (size != null) {
      end = size;
    }
  } else {
    end = start + options.length;
  }
  if (size != null && end != null && size < end) {
    end = size;
  }
  if (end != null && end < start) {
    end = start;
  }
  return { start, end };
}

export function deleteStartLength(options: ConvertOptions) {
  options = { ...options };
  delete options.start;
  delete options.length;
  return options;
}

export function hasNoStartLength(options: ConvertOptions) {
  return options.start == null && options.length == null;
}

export function isEmpty(input: Data, options?: Partial<ConvertOptions>) {
  return !input || options?.length === 0;
}

export abstract class AbstractConverter<T extends Data>
  implements Converter<T>
{
  public abstract type: DataType;

  public async convert(
    input: Data,
    options?: Partial<ConvertOptions>
  ): Promise<T> {
    if (isEmpty(input, options)) {
      return this.empty();
    }

    const converted = await this._convert(input, this._initOptions(options));
    if (typeof converted !== "undefined") {
      return converted;
    }

    throw new Error(
      `[${this.constructor.name}] Illegal input: ${getType(input)}`
    );
  }

  public async getSize(input: T, options?: Partial<Options>): Promise<number> {
    if (this._isEmpty(input)) {
      return 0;
    }

    return await this._getSize(input, this._initOptions(options));
  }

  public isEmpty(input: T, options?: Partial<Options>) {
    if (isEmpty(input, options)) {
      return true;
    }
    return this._isEmpty(input);
  }

  public async merge(chunks: T[], options?: Partial<Options>): Promise<T> {
    if (!chunks || chunks.length === 0) {
      return this.empty();
    }
    if (chunks.length === 1) {
      return chunks[0] as T;
    }

    return await this._merge(chunks, this._initOptions(options));
  }

  public async toArrayBuffer(
    input: T,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    if (this._isEmpty(input)) {
      return EMPTY_ARRAY_BUFFER;
    }
    return await this._toArrayBuffer(input, options);
  }

  public async toBase64(input: T, options: ConvertOptions): Promise<string> {
    if (this._isEmpty(input)) {
      return "";
    }
    return await this._toBase64(input, options);
  }

  public async toText(input: T, options: ConvertOptions): Promise<string> {
    if (this._isEmpty(input)) {
      return "";
    }
    return await this._toText(input, options);
  }

  public async toUint8Array(
    input: T,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    if (this._isEmpty(input)) {
      return EMPTY_UINT8_ARRAY;
    }
    return await this._toUint8Array(input, options);
  }

  public abstract empty(): T;
  public abstract match(
    input: Data,
    options?: Partial<ConvertOptions>
  ): input is T;

  protected abstract _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<T | undefined>;
  protected abstract _getSize(input: T, options: Options): Promise<number>;
  protected abstract _getStartEnd(
    input: T,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }>;
  protected abstract _isEmpty(input: T): boolean;
  protected abstract _merge(chunks: T[], options: Options): Promise<T>;
  protected abstract _toArrayBuffer(
    input: T,
    options: ConvertOptions
  ): Promise<ArrayBuffer>;
  protected abstract _toBase64(
    input: T,
    options: ConvertOptions
  ): Promise<string>;
  protected abstract _toText(
    input: T,
    options: ConvertOptions
  ): Promise<string>;
  protected abstract _toUint8Array(
    input: T,
    options: ConvertOptions
  ): Promise<Uint8Array>;

  private _initOptions<T extends Options>(
    options?: Partial<ConvertOptions>
  ): ConvertOptions {
    if (!options) options = {};
    if (options.bufferSize == null) options.bufferSize = DEFAULT_BUFFER_SIZE;
    const rem = options.bufferSize % 6;
    if (rem !== 0) {
      options.bufferSize -= rem;
      console.info(
        `"bufferSize" was modified to ${options.bufferSize}. ("bufferSize" must be divisible by 6.)`
      );
    }
    if (!options.srcStringType) options.srcStringType = "text";
    if (!options.bufferToTextCharset) options.bufferToTextCharset = "utf8";
    if (!options.textToBufferCharset) options.textToBufferCharset = "utf8";
    if (options.dstURLType === "file") {
      if (!isNode) {
        throw new Error("File URL is not supported");
      }
    } else if (options.dstURLType === "blob") {
      if (!hasBlob || typeof URL?.createObjectURL !== "function") {
        throw new Error("Blob URL is not supported");
      }
    } else if (options.dstURLType === "data") {
      // Do nothing
    } else {
      if (isNode) {
        options.dstURLType = "file";
      } else if (isBrowser) {
        options.dstURLType = "blob";
      } else {
        options.dstURLType = "data";
      }
    }
    return options as T;
  }
}
