import {
  AbstractConverter,
  UnivConvInternal,
} from "./converters/AbstractConverter";
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
  ReturnData,
  UnivConv,
} from "./converters/core.js";
import {
  closeStream,
  hasBlob,
  hasReadableStream,
  isNodeJSWritableStream,
  isWritable,
  isWritableStream,
  pipeNodeStream,
  pipeWebStream,
} from "./converters/Environment";
import { FalseConverter } from "./converters/FalseConverter";
import { HexConverter } from "./converters/HexConverter";
import { TextConverter } from "./converters/TextConverter";
import { Uint8ArrayConverter } from "./converters/Uint8ArrayConverter";
import { URLConverter } from "./converters/URLConverter";

class DefaultUnivConv implements UnivConvInternal {
  private converters: Map<string, Converter<Data>> = new Map<
    string,
    Converter<Data>
  >();

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

  public addConverter(name: string, converter: Converter<Data>) {
    this.converters.set(name, converter);
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
    return await converter.from(input, options);
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
    output: NodeJS.WritableStream | WritableStream<unknown> | string,
    options?: Partial<ConvertOptions>
  ): Promise<void> {
    if (isNodeJSWritableStream(output)) {
      const readable = await this._of("readable").from(input, options);
      try {
        await pipeNodeStream(readable, output);
      } catch (e) {
        if (isWritable(output)) closeStream(output, e);
      }
    } else if (isWritableStream(output)) {
      let stream: ReadableStream<unknown>;
      try {
        stream = await this._of("readablestream").from(input, options);
        await pipeWebStream(stream, output);
        closeStream(output);
      } catch (e) {
        closeStream(output, e);
      }
    } else if (typeof output === "string") {
      await this._of("url").from(input, {
        ...options,
        outputURL: output,
      });
    } else {
      throw new Error("Illegal output type: " + getType(output));
    }
  }

  public removeConverter(name: string) {
    this.converters.delete(name);
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
      return await converter.from(input, options);
    }
    throw new Error("Illegal output type: " + getType(input));
  }

  public async _convertAll<T extends DataType>(
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

export const getUnivConv = async () => {
  if (AbstractConverter._UNIV_CONV) {
    return AbstractConverter._UNIV_CONV;
  }

  const univConv = new DefaultUnivConv();

  univConv.addConverter("base64", new Base64Converter());
  univConv.addConverter("binary", new BinaryConverter());
  univConv.addConverter("hex", new HexConverter());
  univConv.addConverter("url", new URLConverter());
  univConv.addConverter("text", new TextConverter());
  univConv.addConverter("arraybuffer", new ArrayBufferConverter());
  univConv.addConverter("uint8array", new Uint8ArrayConverter());
  if (hasBlob) {
    const bc = new (await import("./converters/BlobConverter")).BlobConverter();
    univConv.addConverter("blob", bc);
  } else {
    univConv.addConverter("blob", new FalseConverter("Blob"));
  }
  try {
    const rc = new (
      await import("./converters/ReadableConverter")
    ).ReadableConverter();
    univConv.addConverter("readable", rc);
  } catch {
    univConv.addConverter("readable", new FalseConverter("Readable"));
  }
  if (hasReadableStream) {
    const rsc = new (
      await import("./converters/ReadableStreamConverter")
    ).ReadableStreamConverter();
    univConv.addConverter("readablestream", rsc);
  } else {
    univConv.addConverter(
      "readablestream",
      new FalseConverter("ReadableStream")
    );
  }

  AbstractConverter._UNIV_CONV = univConv;
  return AbstractConverter._UNIV_CONV as UnivConv;
};
