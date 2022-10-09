import type { Readable, Writable } from "stream";
import { ArrayBufferConverter } from "./converters/ArrayBufferConverter";
import { Base64Converter } from "./converters/Base64Converter";
import { BinaryConverter } from "./converters/BinaryConverter";
import {
  Converter,
  ConvertOptions,
  Data,
  DataType,
  getType,
  isEmpty,
  Options,
} from "./converters/core";
import { FalseConverter } from "./converters/FalseConverter";
import { HexConverter } from "./converters/HexConverter";
import {
  closeStream,
  hasBlob,
  hasBuffer,
  hasReadableStream,
  isWritable,
  isWritableStream,
  pipeNodeStream,
  pipeWebStream,
} from "./converters/NodeUtil";
import { TextConverter } from "./converters/TextConverter";
import { Uint8ArrayConverter } from "./converters/Uint8ArrayConverter";
import { URLConverter } from "./converters/URLConverter";

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

export class AnyConv {
  private converters = new Map<DataType, Converter<Data>>();
  private initialized = false;

  constructor() {
    this._initialize()
      .then(() => {
        this.initialized = true;
      })
      .catch((e) => console.warn(e));
  }

  public async convert<T extends DataType>(
    returnType: T,
    input: Data,
    options?: Partial<ConvertOptions>
  ): Promise<ReturnData<T>> {
    if (options?.length === 0) {
      return this.emptyOf(returnType);
    }

    const converter = this.converterOf(returnType);
    return await converter.convert(input, options);
  }

  public empty<T extends Data>(input: T): T {
    if (typeof input === "string") {
      return "" as T;
    }
    const converter = this.converter(input);
    return converter.empty() as T;
  }

  public emptyOf<T extends DataType>(returnType: T): ReturnData<T> {
    const converter = this.converterOf(returnType);
    return converter.empty();
  }

  public converter(
    input: Data,
    options?: Partial<ConvertOptions>
  ): Converter<Data> {
    for (const converter of this.converters.values()) {
      if (converter.match(input, options)) {
        return converter;
      }
    }
    throw new Error(
      `No converter: input=${getType(input)}, srcStringType=${
        options?.srcStringType // eslint-disable-line
      }`
    );
  }

  public async merge<T extends DataType>(
    to: T,
    chunks: Data[],
    options?: Partial<Options>
  ): Promise<ReturnData<T>> {
    const results = await this._convertAll(to, chunks, options);
    const converter = this.converterOf(to);
    return await converter.merge(results, options);
  }

  public converterOf<T extends DataType>(type: T): Converter<ReturnData<T>> {
    const converter = this.converters.get(type);
    if (converter) {
      return converter as Converter<ReturnData<T>>;
    }
    throw new Error(`No converter: type=${type}`);
  }

  public async pipe(
    input: Data,
    output: Writable | WritableStream<Uint8Array>,
    options?: Partial<ConvertOptions>
  ): Promise<void> {
    if (isWritable(output)) {
      const readable = await this.converterOf("readable").convert(
        input,
        options
      );
      try {
        await pipeNodeStream(readable, output);
      } catch (e) {
        closeStream(output, e);
      }
    } else if (isWritableStream(output)) {
      let stream: ReadableStream<Uint8Array>;
      try {
        stream = await this.converterOf("readablestream").convert(
          input,
          options
        );
        await pipeWebStream(stream, output);
        closeStream(output);
      } catch (e) {
        closeStream(output, e);
      }
    } else {
      throw new Error("Illegal output type: " + getType(output));
    }
  }

  public async size(input: Data, options?: Partial<Options>): Promise<number> {
    const converter = this.converter(input, options);
    return await converter.size(input, options);
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

    const converter = this.converter(input, options);
    if (converter) {
      return await converter.convert(input, options);
    }
    throw new Error("Illegal output type: " + getType(input));
  }

  protected async _convertAll<T extends DataType>(
    to: T,
    chunks: Data[],
    options?: Partial<ConvertOptions>
  ): Promise<ReturnData<T>[]> {
    const results: ReturnData<T>[] = [];
    for (const chunk of chunks) {
      const converted = await this.convert(to, chunk, options);
      results.push(converted);
    }
    return results;
  }

  protected async _initialize() {
    if (this.initialized) {
      return;
    }

    this.converters.set("base64", new Base64Converter());
    this.converters.set("binary", new BinaryConverter());
    this.converters.set("hex", new HexConverter());
    this.converters.set("url", new URLConverter());
    this.converters.set("text", new TextConverter());
    this.converters.set("arraybuffer", new ArrayBufferConverter());
    if (hasBuffer) {
      const bc = new (
        await import("./converters/BufferConverter")
      ).BufferConverter();
      this.converters.set("buffer", bc);
    } else {
      this.converters.set("buffer", new FalseConverter("Buffer"));
    }
    this.converters.set("uint8array", new Uint8ArrayConverter());
    if (hasBlob) {
      const bc = new (
        await import("./converters/BlobConverter")
      ).BlobConverter();
      this.converters.set("blob", bc);
    } else {
      this.converters.set("blob", new FalseConverter("Blob"));
    }
    try {
      const rc = new (
        await import("./converters/ReadableConverter")
      ).ReadableConverter();
      this.converters.set("readable", rc);
    } catch {
      this.converters.set("readable", new FalseConverter("Readable"));
    }
    if (hasReadableStream) {
      const rsc = new (
        await import("./converters/ReadableStreamConverter")
      ).ReadableStreamConverter();
      this.converters.set("readablestream", rsc);
    } else {
      this.converters.set(
        "readablestream",
        new FalseConverter("ReadableStream")
      );
    }
  }
}

export const DEFAULT_CONVERTER = new AnyConv();
