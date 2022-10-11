import type { Writable } from "stream";
import {
  AbstractConverter,
  AnyConvInternal,
} from "./converters/AbstractConverter";
import { ArrayBufferConverter } from "./converters/ArrayBufferConverter";
import { Base64Converter } from "./converters/Base64Converter";
import { BinaryConverter } from "./converters/BinaryConverter";
import {
  AnyConv,
  Converter,
  ConvertOptions,
  Data,
  DataType,
  getType,
  isEmpty,
  Options,
  ReturnData,
} from "./converters/core";
import { FalseConverter } from "./converters/FalseConverter";
import { HexConverter } from "./converters/HexConverter";
import {
  closeStream,
  hasBlob,
  hasReadableStream,
  isWritable,
  isWritableStream,
  pipeNodeStream,
  pipeWebStream,
} from "./converters/Environment";
import { TextConverter } from "./converters/TextConverter";
import { Uint8ArrayConverter } from "./converters/Uint8ArrayConverter";
import { URLConverter } from "./converters/URLConverter";

class DefaultAnyConv implements AnyConvInternal {
  constructor(private converters: Map<DataType, Converter<Data>>) {}

  public _empty<T extends Data>(input: T): T {
    if (typeof input === "string") {
      return "" as T;
    }
    const converter = this._find(input);
    return converter.empty();
  }

  public _emptyOf<T extends DataType>(type: T): ReturnData<T> {
    const converter = this._of(type);
    return converter.empty();
  }

  public _find<T extends Data>(
    input: T,
    options?: Partial<ConvertOptions>
  ): Converter<T> {
    for (const converter of this.converters.values()) {
      if (converter.is(input, options)) {
        return converter as Converter<T>;
      }
    }
    throw new Error(
      `No converter: input=${getType(input)}, srcStringType=${
        options?.inputStringType // eslint-disable-line
      }`
    );
  }

  public _of<T extends DataType>(type: T): Converter<ReturnData<T>> {
    const converter = this.converters.get(type);
    if (converter) {
      return converter as Converter<ReturnData<T>>;
    }
    throw new Error(`No converter: type=${type}`);
  }

  public async convert<T extends DataType>(
    returnType: T,
    input: Data,
    options?: Partial<ConvertOptions>
  ): Promise<ReturnData<T>> {
    if (options?.length === 0) {
      return this._emptyOf(returnType);
    }

    const converter = this._of(returnType);
    return await converter.convert(input, options);
  }

  is<T extends DataType>(
    type: T,
    input: unknown,
    options?: Partial<ConvertOptions> | undefined
  ): input is ReturnData<T> {
    const converter = this._of(type);
    return converter.is(input, options);
  }

  public async merge<T extends DataType>(
    to: T,
    chunks: Data[],
    options?: Partial<Options>
  ): Promise<ReturnData<T>> {
    const results = await this._convertAll(to, chunks, options);
    const converter = this._of(to);
    return await converter.merge(results, options);
  }

  public async pipe(
    input: Data,
    output: Writable | WritableStream<Uint8Array>,
    options?: Partial<ConvertOptions>
  ): Promise<void> {
    if (isWritable(output)) {
      const readable = await this._of("readable").convert(input, options);
      try {
        await pipeNodeStream(readable, output);
      } catch (e) {
        closeStream(output, e);
      }
    } else if (isWritableStream(output)) {
      let stream: ReadableStream<Uint8Array>;
      try {
        stream = await this._of("readablestream").convert(input, options);
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
    const converter = this._find(input, options);
    return await converter.size(input, options);
  }

  public async slice<T extends Data>(
    input: T,
    options: Partial<ConvertOptions>
  ): Promise<T> {
    if (
      typeof options.start !== "number" &&
      typeof options.length !== "number"
    ) {
      throw new Error(
        "Illegal argument: options.start and options.length are undefined."
      );
    }
    if (isEmpty(input, options)) {
      return Promise.resolve(this._empty(input));
    }

    const converter = this._find(input, options);
    if (converter) {
      return await converter.convert(input, options);
    }
    throw new Error("Illegal output type: " + getType(input));
  }

  protected async _convertAll<T extends DataType>(
    returnType: T,
    chunks: Data[],
    options?: Partial<ConvertOptions>
  ): Promise<ReturnData<T>[]> {
    const results: ReturnData<T>[] = [];
    for (const chunk of chunks) {
      const converted = await this.convert(returnType, chunk, options);
      results.push(converted);
    }
    return results;
  }
}

export const getAnyConv = async () => {
  if (AbstractConverter._ANY_CONV) {
    return AbstractConverter._ANY_CONV;
  }

  const converters = new Map<DataType, Converter<Data>>();
  converters.set("base64", new Base64Converter());
  converters.set("binary", new BinaryConverter());
  converters.set("hex", new HexConverter());
  converters.set("url", new URLConverter());
  converters.set("text", new TextConverter());
  converters.set("arraybuffer", new ArrayBufferConverter());
  converters.set("uint8array", new Uint8ArrayConverter());
  if (hasBlob) {
    const bc = new (await import("./converters/BlobConverter")).BlobConverter();
    converters.set("blob", bc);
  } else {
    converters.set("blob", new FalseConverter("Blob"));
  }
  try {
    const rc = new (
      await import("./converters/ReadableConverter")
    ).ReadableConverter();
    converters.set("readable", rc);
  } catch {
    converters.set("readable", new FalseConverter("Readable"));
  }
  if (hasReadableStream) {
    const rsc = new (
      await import("./converters/ReadableStreamConverter")
    ).ReadableStreamConverter();
    converters.set("readablestream", rsc);
  } else {
    converters.set("readablestream", new FalseConverter("ReadableStream"));
  }

  const anyConv = new DefaultAnyConv(converters);
  AbstractConverter._ANY_CONV = anyConv;
  return AbstractConverter._ANY_CONV as AnyConv;
};
