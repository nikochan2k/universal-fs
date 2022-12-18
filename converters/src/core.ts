/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Variant = object | number | boolean | bigint | string;
export type ExcludeString = object | number | boolean | bigint;
export type FunctionType<T> = new (...args: any[]) => T;
export type VariantOrNull = Variant | null;

export interface SliceOptions {
  length?: number;
  start?: number;
}

export interface ConvertOptions extends SliceOptions {
  bufferSize?: number;
}

export interface ConvertStringOptions extends ConvertOptions {
  srcType?: string;
}

export type ConverterLocationFn = (srcType: string, dstType: string) => string;
export type HandlerLocationFn = (type: string) => string;

export interface Converter<ST extends Variant, DT extends Variant> {
  convert(src: ST, options?: ConvertOptions): Promise<DT>;
}

export interface Handler<T extends Variant> {
  empty(): Promise<T>;
  isEmpty(src: T): Promise<boolean>;
  merge(src: T[], bufferSize?: number): Promise<T>;
  size(src: T): Promise<number>;
  slice(src: T, options?: SliceOptions): Promise<T>;
}

export abstract class AbstractHandler<T extends Variant> implements Handler<T> {
  public async isEmpty(src: T): Promise<boolean> {
    this.validateSource(src);
    return await this._isEmpty(src);
  }

  public async merge(src: T[], bufferSize?: number): Promise<T> {
    if (src == null) {
      throw new TypeError("src is null or undefined");
    }
    for (const chunk of src) {
      this.validateSource(chunk);
    }
    this.validateValue("bufferSize", bufferSize);

    return await this._merge(src, bufferSize);
  }

  public async size(src: T): Promise<number> {
    this.validateSource(src);
    return await this._size(src);
  }

  public async slice(src: T, options?: SliceOptions): Promise<T> {
    this.validateSource(src);
    this.validateValue("options.start", options?.start);
    this.validateValue("options.length", options?.length);

    if (options?.length === 0) {
      return await this.empty();
    }
    return await this._slice(src, options);
  }

  public abstract empty(): Promise<T>;

  protected validateSource(src: T): void {
    if (src == null) {
      throw new TypeError("src is null or undefined");
    }
    this._validateSource(src);
  }

  protected validateValue(name: string, value?: number): void {
    if (value == null) {
      return;
    }

    if (typeof value !== "number" || isNaN(value)) {
      throw new TypeError(`${name} is not a number`);
    }
    if (value < 0) {
      throw new TypeError(`${name} is negative value`);
    }
  }

  protected abstract _isEmpty(src: T): Promise<boolean>;
  protected abstract _merge(src: T[], bufferSize?: number): Promise<T>;
  protected abstract _size(src: T): Promise<number>;
  protected abstract _slice(src: T, options?: SliceOptions): Promise<T>;
  protected abstract _validateSource(src: T): void;
}
