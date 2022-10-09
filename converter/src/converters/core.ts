import type { Readable } from "stream";

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
  match(input: unknown, options?: Partial<ConvertOptions>): input is T;
  merge(chunks: T[], options?: Partial<Options>): Promise<T>;
  size(input: T, options?: Partial<Options>): Promise<number>;
  toArrayBuffer(input: T, options: ConvertOptions): Promise<ArrayBuffer>;
  toBase64(input: T, options: ConvertOptions): Promise<string>;
  toText(input: T, options: ConvertOptions): Promise<string>;
  toUint8Array(input: T, options: ConvertOptions): Promise<Uint8Array>;
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

export function getType(input: unknown): string {
  const type = typeof input;
  if (type === "function" || type === "object") {
    // eslint-disable-next-line
    return (input as any)?.constructor?.name || String.toString.call(input);
  }
  return type;
}
