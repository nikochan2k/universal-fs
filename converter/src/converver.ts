import type { Readable, Writable } from "stream";
import {
  arrayBufferConverter,
  base64Converter,
  binaryConverter,
  blobConverter,
  bufferConverter,
  closeStream,
  Converter,
  ConvertOptions,
  Data,
  DataType,
  hexConverter,
  isBrowser,
  isNode,
  isWritable,
  isWritableStream,
  Options,
  pipeNodeStream,
  pipeWebStream,
  readableConverter,
  readableStreamConverter,
  textConverter,
  typeOf,
  uint8ArrayConverter,
  urlConverter,
} from "./converters";

export type ReturnData<T extends DataType> = T extends "arraybuffer"
  ? ArrayBuffer
  : T extends "uint8array"
  ? Uint8Array
  : T extends "buffer"
  ? Buffer
  : T extends "blob"
  ? Blob
  : T extends "readable"
  ? Readable
  : T extends "readablestream"
  ? ReadableStream<Uint8Array>
  : T extends "text"
  ? string
  : T extends "base64"
  ? string
  : T extends "binary"
  ? string
  : T extends "hex"
  ? string
  : T extends "url"
  ? string
  : Data;

export class DefaultConverter {
  private converters: Converter<Data>[];
  private binaryAndStreamConverters: Converter<Data>[] = [];
  private binaryConverters: Converter<Data>[] = [];
  private stringConverters: Converter<Data>[] = [];
  private streamConverters: Converter<Data>[] = [];

  constructor() {
    this.binaryConverters.push(arrayBufferConverter());
    this.binaryConverters.push(bufferConverter());
    this.binaryConverters.push(uint8ArrayConverter());
    this.binaryConverters.push(blobConverter());
    this.streamConverters.push(readableConverter());
    this.streamConverters.push(readableStreamConverter());
    this.stringConverters.push(textConverter());
    this.stringConverters.push(base64Converter());
    this.stringConverters.push(binaryConverter());
    this.stringConverters.push(hexConverter());
    this.stringConverters.push(urlConverter());
    this.binaryAndStreamConverters = [
      ...this.binaryConverters,
      ...this.streamConverters,
    ];
    this.converters = [
      ...this.binaryConverters,
      ...this.streamConverters,
      ...this.stringConverters,
    ];
  }

  public async convert<T extends DataType>(
    input: Data,
    to: T,
    options?: Partial<ConvertOptions>
  ): Promise<ReturnData<T>> {
    return await (this._convert(input, to, options) as Promise<ReturnData<T>>);
  }

  public empty<T extends DataType>(type?: T): ReturnData<T> {
    if (type) {
      for (const converter of this.converters) {
        if (converter.type === type) {
          return converter.empty() as ReturnData<T>;
        }
      }
    }

    if (isBrowser) {
      return blobConverter().empty() as ReturnData<T>;
    } else if (isNode) {
      return bufferConverter().empty() as ReturnData<T>;
    } else {
      return uint8ArrayConverter().empty() as ReturnData<T>;
    }
  }

  public emptyOf<T extends Data>(input: T): T {
    if (typeof input === "string") {
      return "" as T;
    }
    for (const converter of this.binaryAndStreamConverters) {
      if (converter.typeEquals(input)) {
        return converter.empty() as T;
      }
    }

    throw new Error("Illegal input: " + typeOf(input));
  }

  public async getSize(
    input: Data,
    options?: Partial<Options>
  ): Promise<number> {
    if (typeof input === "string") {
      const type = options?.srcStringType;
      if (type == null || type === "text") {
        return await textConverter().getSize(input, options);
      } else if (type === "base64") {
        return await base64Converter().getSize(input, options);
      } else if (type === "binary") {
        return await binaryConverter().getSize(input, options);
      } else if (type === "hex") {
        return await hexConverter().getSize(input, options);
      } else if (type === "url") {
        return await urlConverter().getSize(input, options);
      }
    }

    for (const converter of this.binaryAndStreamConverters) {
      if (converter.typeEquals(input)) {
        return await converter.getSize(input, options);
      }
    }

    throw new Error("Illegal input: " + typeOf(input));
  }

  public async merge<T extends DataType>(
    chunks: Data[],
    to: T,
    options?: Partial<Options>
  ): Promise<ReturnData<T>> {
    return (await this._merge(chunks, to, options)) as ReturnData<T>;
  }

  public async pipe(
    input: Data,
    output: Writable | WritableStream<Uint8Array>,
    options?: Partial<ConvertOptions>
  ): Promise<void> {
    if (isWritable(output)) {
      const readable = await readableConverter().convert(input, options);
      try {
        await pipeNodeStream(readable, output);
      } catch (e) {
        closeStream(output, e);
      }
    } else if (isWritableStream(output)) {
      let stream: ReadableStream<Uint8Array>;
      try {
        stream = await readableStreamConverter().convert(input, options);
        await pipeWebStream(stream, output);
        closeStream(output);
      } catch (e) {
        closeStream(output, e);
      }
    } else {
      throw new Error("Illegal output type: " + typeOf(output));
    }
  }

  public async slice(
    input: Data,
    options: Partial<ConvertOptions>
  ): Promise<Data> {
    if (
      typeof options.start !== "number" &&
      typeof options.length !== "number"
    ) {
      throw new Error(
        "Illegal argument: options.start and options.length are undefined."
      );
    }
    if (options.length === 0) {
      return Promise.resolve(this.emptyOf(input));
    }

    let to: DataType | undefined;
    if (typeof input === "string") {
      const type = options?.srcStringType;
      if (type == null || type === "text") {
        to = "text";
      } else if (type === "base64") {
        to = "base64";
      } else if (type === "binary") {
        to = "binary";
      } else if (type === "hex") {
        to = "hex";
      } else if (type === "url") {
        to = "url";
      }
    } else {
      for (const converter of this.binaryAndStreamConverters) {
        if (converter.typeEquals(input)) {
          to = converter.type;
          break;
        }
      }
    }
    if (to) {
      return await this._convert(input, to, options);
    }

    throw new Error("Illegal output type: " + typeOf(input));
  }

  public async toArrayBuffer(
    input: Data | Data[],
    options?: Partial<ConvertOptions>
  ): Promise<ArrayBuffer> {
    if (Array.isArray(input)) {
      return await this.merge(input, "arraybuffer", options);
    } else {
      return await this.convert(input, "arraybuffer", options);
    }
  }

  public async toBase64(
    input: Data | Data[],
    options?: Partial<ConvertOptions>
  ): Promise<string> {
    if (Array.isArray(input)) {
      return await this.merge(input, "base64", options);
    } else {
      return await this.convert(input, "base64", options);
    }
  }

  public async toBinary(
    input: Data | Data[],
    options?: Partial<ConvertOptions>
  ): Promise<string> {
    if (Array.isArray(input)) {
      return await this.merge(input, "binary", options);
    } else {
      return await this.convert(input, "binary", options);
    }
  }

  public async toBlob(
    input: Data | Data[],
    options?: Partial<ConvertOptions>
  ): Promise<Blob> {
    if (Array.isArray(input)) {
      return await this.merge(input, "blob", options);
    } else {
      return await this.convert(input, "blob", options);
    }
  }

  public async toBuffer(
    input: Data | Data[],
    options?: Partial<ConvertOptions>
  ): Promise<Buffer> {
    if (Array.isArray(input)) {
      return await this.merge(input, "buffer", options);
    } else {
      return await this.convert(input, "buffer", options);
    }
  }

  public async toHex(
    input: Data | Data[],
    options?: Partial<ConvertOptions>
  ): Promise<string> {
    if (Array.isArray(input)) {
      return await this.merge(input, "hex", options);
    } else {
      return await this.convert(input, "hex", options);
    }
  }

  public async toReadable(
    input: Data | Data[],
    options?: Partial<ConvertOptions>
  ): Promise<Readable> {
    if (Array.isArray(input)) {
      return await this.merge(input, "readable", options);
    } else {
      return await this.convert(input, "readable", options);
    }
  }

  public async toReadableStream(
    input: Data | Data[],
    options?: Partial<ConvertOptions>
  ): Promise<ReadableStream<Uint8Array>> {
    if (Array.isArray(input)) {
      return await this.merge(input, "readablestream", options);
    } else {
      return await this.convert(input, "readablestream", options);
    }
  }

  public async toText(
    input: Data | Data[],
    options?: Partial<ConvertOptions>
  ): Promise<string> {
    if (Array.isArray(input)) {
      return await this.merge(input, "text", options);
    } else {
      return await this.convert(input, "text", options);
    }
  }

  public async toURL(
    input: Data | Data[],
    options?: Partial<ConvertOptions>
  ): Promise<string> {
    if (Array.isArray(input)) {
      return await this.merge(input, "url", options);
    } else {
      return await this.convert(input, "url", options);
    }
  }

  public async toUint8Array(
    input: Data | Data[],
    options?: Partial<ConvertOptions>
  ): Promise<Uint8Array> {
    if (Array.isArray(input)) {
      return await this.merge(input, "uint8array", options);
    } else {
      return await this.convert(input, "uint8array", options);
    }
  }

  protected async _convert<T extends DataType>(
    input: Data,
    to: T,
    options?: Partial<ConvertOptions>
  ): Promise<Data> {
    for (const converter of this.converters) {
      return await converter.convert(input, options);
    }

    throw new Error("Illegal output type: " + to);
  }

  protected async _convertAll<T extends DataType>(
    chunks: Data[],
    to: T,
    options?: Partial<ConvertOptions>
  ): Promise<ReturnData<T>[]> {
    const results: ReturnData<T>[] = [];
    for (const chunk of chunks) {
      const converted = await this.convert(chunk, to, options);
      results.push(converted);
    }
    return results;
  }

  protected async _merge<T extends DataType>(
    chunks: Data[],
    to: T,
    options?: Partial<Options>
  ) {
    const results = await this._convertAll(chunks, to, options);

    for (const converter of this.converters) {
      if (converter.type === to) {
        return await converter.merge(results, options);
      }
    }

    throw new Error("Illegal output type: " + to);
  }
}

export const DEFAULT_CONVERTER = new DefaultConverter();
