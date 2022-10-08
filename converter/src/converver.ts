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
  getType,
  hexConverter,
  isEmpty,
  isWritable,
  isWritableStream,
  Options,
  pipeNodeStream,
  pipeWebStream,
  readableConverter,
  readableStreamConverter,
  textConverter,
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
  private converters = new Map<DataType, Converter<Data>>();

  constructor() {
    this.converters.set("arraybuffer", arrayBufferConverter());
    this.converters.set("buffer", bufferConverter());
    this.converters.set("uint8array", uint8ArrayConverter());
    this.converters.set("blob", blobConverter());
    this.converters.set("readable", readableConverter());
    this.converters.set("readablestream", readableStreamConverter());
    this.converters.set("base64", base64Converter());
    this.converters.set("binary", binaryConverter());
    this.converters.set("hex", hexConverter());
    this.converters.set("url", urlConverter());
    this.converters.set("text", textConverter());
  }

  public async convert<T extends DataType>(
    input: Data,
    to: T,
    options?: Partial<ConvertOptions>
  ): Promise<ReturnData<T>> {
    return await (this._convert(input, to, options) as Promise<ReturnData<T>>);
  }

  public empty<T extends Data>(input: T): T {
    if (typeof input === "string") {
      return "" as T;
    }
    const converter = this.getConverter(input);
    if (converter) {
      return converter.empty() as T;
    }

    throw new Error("Illegal input: " + getType(input));
  }

  public emptyOfType<T extends DataType>(type: T): ReturnData<T> {
    const converter = this.getConverterOfType(type);
    return converter.empty() as ReturnData<T>;
  }

  public getConverter(
    input: Data,
    options?: Partial<ConvertOptions>
  ): Converter<Data> | undefined {
    for (const converter of this.converters.values()) {
      if (converter.typeEquals(input, options)) {
        return converter;
      }
    }
    throw new Error(
      `No converter: input=${getType(input)}, srcStringType=${
        options?.srcStringType // eslint-disable-line
      }`
    );
  }

  public getConverterOfType(type: DataType): Converter<Data> {
    const converter = this.converters.get(type);
    if (converter) {
      return converter;
    }
    throw new Error(`No converter: type=${type}`);
  }

  public async getSize(
    input: Data,
    options?: Partial<Options>
  ): Promise<number> {
    const converter = this.getConverter(input, options);
    if (converter) {
      return await converter.getSize(input, options);
    }

    throw new Error("Illegal input: " + getType(input));
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
      throw new Error("Illegal output type: " + getType(output));
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
    if (isEmpty(input, options)) {
      return Promise.resolve(this.empty(input));
    }

    const converter = this.getConverter(input, options);
    if (converter) {
      return await converter.convert(input, options);
    }
    throw new Error("Illegal output type: " + getType(input));
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
    if (options?.length === 0) {
      return this.emptyOfType(to);
    }

    const converter = this.getConverterOfType(to);
    return await converter.convert(input, options);
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
    const converter = this.getConverterOfType(to);
    // eslint-disable-next-line
    return await converter.merge(results as any[], options); // TODO
  }
}

export const DEFAULT_CONVERTER = new DefaultConverter();
