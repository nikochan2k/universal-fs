import {
  AnyConv,
  Converter,
  ConvertOptions,
  Data,
  DataType,
  DEFAULT_BUFFER_SIZE,
  EMPTY_ARRAY_BUFFER,
  EMPTY_UINT8_ARRAY,
  getType,
  isEmpty,
  Options,
  ReturnData,
} from "./core";

export interface AnyConvInternal extends AnyConv {
  _empty<T extends Data>(input: T): T;
  _emptyOf<T extends DataType>(type: T): ReturnData<T>;
  _find<T extends Data>(
    input: T,
    options?: Partial<ConvertOptions>
  ): Converter<T>;
  _of<T extends DataType>(type: T): Converter<ReturnData<T>>;
}

export function _() {
  return AbstractConverter._ANY_CONV;
}

export abstract class AbstractConverter<T extends Data>
  implements Converter<T>
{
  public static _ANY_CONV: AnyConvInternal;

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

  public isEmpty(input: T, options?: Partial<Options>) {
    return isEmpty(input, options) && this._isEmpty(input);
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

  public async size(input: T, options?: Partial<Options>): Promise<number> {
    if (this.isEmpty(input, options)) {
      return 0;
    }

    return await this._size(input, this._initOptions(options));
  }

  public async toArrayBuffer(
    input: T,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    if (this.isEmpty(input)) {
      return EMPTY_ARRAY_BUFFER;
    }
    return await this._toArrayBuffer(input, options);
  }

  public async toBase64(input: T, options: ConvertOptions): Promise<string> {
    if (this.isEmpty(input, options)) {
      return "";
    }
    return await this._toBase64(input, options);
  }

  public async toText(input: T, options: ConvertOptions): Promise<string> {
    if (this.isEmpty(input, options)) {
      return "";
    }
    return await this._toText(input, options);
  }

  public async toUint8Array(
    input: T,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    if (this.isEmpty(input, options)) {
      return EMPTY_UINT8_ARRAY;
    }
    return await this._toUint8Array(input, options);
  }

  public abstract empty(): T;
  public abstract is(
    input: Data,
    options?: Partial<ConvertOptions>
  ): input is T;

  protected abstract _convert(input: Data, options: ConvertOptions): Promise<T>;
  protected abstract _getStartEnd(
    input: T,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }>;
  protected abstract _isEmpty(input: T): boolean;
  protected abstract _merge(chunks: T[], options: Options): Promise<T>;
  protected abstract _size(input: T, options: Options): Promise<number>;
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
    if (!options.inputStringType) options.inputStringType = "text";
    if (!options.bufferToTextCharset) options.bufferToTextCharset = "utf8";
    if (!options.textToBufferCharset) options.textToBufferCharset = "utf8";
    if (!options.outputURL) options.outputURL = "data";
    return options as T;
  }
}
