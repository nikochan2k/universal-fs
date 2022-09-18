import type { Readable, Writable } from "stream";
import {
  arrayBufferConverter,
  base64Converter,
  binaryConverter,
  blobConverter,
  bufferConverter,
  closeStream,
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
  public async convert<T extends DataType>(
    input: Data,
    to: T,
    options?: Partial<ConvertOptions>
  ): Promise<ReturnData<T>> {
    return await (this._convert(input, to, options) as Promise<ReturnData<T>>);
  }

  public empty<T extends DataType>(type?: T): ReturnData<T> {
    switch (type) {
      case "arraybuffer":
        return arrayBufferConverter().empty() as ReturnData<T>;
      case "buffer":
        return bufferConverter().empty() as ReturnData<T>;
      case "uint8array":
        return uint8ArrayConverter().empty() as ReturnData<T>;
      case "blob":
        return blobConverter().empty() as ReturnData<T>;
      case "readable":
        return readableConverter().empty() as ReturnData<T>;
      case "readablestream":
        return readableStreamConverter().empty() as ReturnData<T>;
      case "text":
        return textConverter().empty() as ReturnData<T>;
      case "base64":
        return base64Converter().empty() as ReturnData<T>;
      case "binary":
        return binaryConverter().empty() as ReturnData<T>;
      case "hex":
        return hexConverter().empty() as ReturnData<T>;
      case "url":
        return urlConverter().empty() as ReturnData<T>;
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
    if (arrayBufferConverter().typeEquals(input)) {
      return arrayBufferConverter().empty() as T;
    } else if (bufferConverter().typeEquals(input)) {
      return bufferConverter().empty() as T;
    } else if (uint8ArrayConverter().typeEquals(input)) {
      return uint8ArrayConverter().empty() as T;
    } else if (blobConverter().typeEquals(input)) {
      return blobConverter().empty() as T;
    } else if (readableConverter().typeEquals(input)) {
      return readableConverter().empty() as T;
    } else if (readableStreamConverter().typeEquals(input)) {
      return readableStreamConverter().empty() as T;
    } else if (typeof input === "string") {
      return "" as T;
    }

    throw new Error("Illegal input: " + typeOf(input));
  }

  public async getSize(
    input: Data,
    options?: Partial<Options>
  ): Promise<number> {
    if (arrayBufferConverter().typeEquals(input)) {
      return await arrayBufferConverter().getSize(
        input as ArrayBuffer,
        options
      );
    } else if (bufferConverter().typeEquals(input)) {
      return await bufferConverter().getSize(input as Buffer, options);
    } else if (uint8ArrayConverter().typeEquals(input)) {
      return await uint8ArrayConverter().getSize(input as Uint8Array, options);
    } else if (blobConverter().typeEquals(input)) {
      return await blobConverter().getSize(input, options);
    } else if (readableConverter().typeEquals(input)) {
      return await readableConverter().getSize(input, options);
    } else if (readableStreamConverter().typeEquals(input)) {
      return await readableStreamConverter().getSize(input, options);
    } else if (typeof input === "string") {
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
    if (arrayBufferConverter().typeEquals(input)) {
      to = "arraybuffer";
    } else if (bufferConverter().typeEquals(input)) {
      to = "buffer";
    } else if (uint8ArrayConverter().typeEquals(input)) {
      to = "uint8array";
    } else if (blobConverter().typeEquals(input)) {
      to = "blob";
    } else if (readableConverter().typeEquals(input)) {
      to = "readable";
    } else if (readableStreamConverter().typeEquals(input)) {
      to = "readablestream";
    } else if (typeof input === "string") {
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
    switch (to) {
      case "arraybuffer":
        return await arrayBufferConverter().convert(input, options);
      case "buffer":
        return await bufferConverter().convert(input, options);
      case "uint8array":
        return await uint8ArrayConverter().convert(input, options);
      case "blob":
        return await blobConverter().convert(input, options);
      case "readable":
        return await readableConverter().convert(input, options);
      case "readablestream":
        return await readableStreamConverter().convert(input, options);
      case "text":
        return await textConverter().convert(input, options);
      case "base64":
        return await base64Converter().convert(input, options);
      case "binary":
        return await binaryConverter().convert(input, options);
      case "hex":
        return await hexConverter().convert(input, options);
      case "url":
        return await urlConverter().convert(input, options);
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

    switch (to) {
      case "arraybuffer":
        return await arrayBufferConverter().merge(
          results as ArrayBuffer[],
          options
        );
      case "buffer":
        return await bufferConverter().merge(results as Buffer[], options);
      case "uint8array":
        return await uint8ArrayConverter().merge(
          results as Uint8Array[],
          options
        );
      case "blob":
        return await blobConverter().merge(results as Blob[], options);
      case "readable":
        return await readableConverter().merge(results as Readable[], options);
      case "readablestream":
        return await readableStreamConverter().merge(
          results as ReadableStream<Uint8Array>[],
          options
        );
      case "text":
        return await textConverter().merge(results as string[], options);
      case "base64":
        return await base64Converter().merge(results as string[], options);
      case "binary":
        return await binaryConverter().merge(results as string[], options);
      case "hex":
        return await hexConverter().merge(results as string[], options);
      case "url":
        return await urlConverter().merge(results as string[], options);
    }

    throw new Error("Illegal output type: " + to);
  }
}

export const DEFAULT_CONVERTER = new DefaultConverter();
