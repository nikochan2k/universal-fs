/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Variant = object | number | boolean | bigint | string;
export type ExcludeString = object | number | boolean | bigint;
export type FunctionType<T> = new (...args: any[]) => T;
export type VariantOrNull = Variant | null;

export interface Options {
  bufferSize?: number;
  length?: number;
  start?: number;
}

export interface StringOptions extends Options {
  srcType?: string;
}

export type ConverterLocationFn = (srcType: string, dstType: string) => string;
export type HandlerLocationFn = (type: string) => string;

export interface Converter<ST extends Variant, DT extends Variant> {
  convert(src: ST, options?: Options): Promise<DT>;
}

export interface Handler<T extends Variant> {
  empty(): Promise<T>;
  isEmpty(src: T, options?: Options): Promise<boolean>;
  merge(src: T[], options?: Options): Promise<T>;
  pipe(
    src: T,
    dst: NodeJS.WritableStream | WritableStream<unknown>,
    options?: Options
  ): Promise<void>;
  size(src: T, options?: Options): Promise<number>;
  slice(src: T, options?: Options): Promise<T>;
}

export abstract class AbstractHandler<T extends Variant> implements Handler<T> {
  public async isEmpty(src: T, options?: Options): Promise<boolean> {
    this.validate(src, options);

    if (options?.length === 0) {
      return true;
    }
    src = await this.slice(src, options);
    return await this._isEmpty(src);
  }

  public async merge(src: T[], options?: Options): Promise<T> {
    if (src == null) {
      throw new TypeError("src is null or undefined");
    }
    if (options) {
      this.validateOptions(options);
    }
    for (const chunk of src) {
      this.validateSource(chunk);
    }

    const merged = await this._merge(src, options?.bufferSize);
    return await this.slice(merged, options);
  }

  public async pipe(
    src: T,
    dst: NodeJS.WritableStream | WritableStream<unknown>,
    options?: Options
  ): Promise<void> {
    this.validate(src, options);
    // TODO validate dst

    src = await this.slice(src, options);
    return await this._pipe(src, dst, options?.bufferSize);
  }

  public async size(src: T, options?: Options): Promise<number> {
    this.validate(src, options);

    src = await this.slice(src, options);
    return await this._size(src, options?.bufferSize);
  }

  public async slice(src: T, options?: Options): Promise<T> {
    this.validate(src, options);

    if (options?.length === 0) {
      return await this.empty();
    }
    return await this._slice(src, options);
  }

  public abstract empty(): Promise<T>;

  protected validate(src: T, options?: Options): void {
    this.validateSource(src);
    if (options) {
      this.validateOptions(options);
    }
  }

  protected validateOptions(options: Options): void {
    this.validateValue("options.start", options.start);
    this.validateValue("options.length", options.length);
    this.validateValue("options.bufferSize", options.bufferSize);
  }

  protected validateSource(src: T): void {
    if (src == null) {
      throw new TypeError("src is null or undefined");
    }
    this._validateSource(src);
  }

  protected validateValue(name: string, start?: number): void {
    if (start != null) {
      if (typeof start !== "number" || isNaN(start)) {
        throw new TypeError(`${name} is not a number`);
      }
      if (start < 0) {
        throw new TypeError(`${name} is negative value`);
      }
    }
  }

  protected abstract _isEmpty(src: T): Promise<boolean>;
  protected abstract _merge(src: T[], bufferSize?: number): Promise<T>;
  protected abstract _pipe(
    src: T,
    dst: NodeJS.WritableStream | WritableStream<unknown>,
    bufferSize?: number
  ): Promise<void>;
  protected abstract _size(src: T, bufferSize?: number): Promise<number>;
  protected abstract _slice(src: T, options?: Options): Promise<T>;
  protected abstract _validateSource(src: T): void;
}
