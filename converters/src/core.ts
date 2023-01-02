/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Variant = object | number | boolean | bigint | string;
export type ExcludeString = object | number | boolean | bigint;
export type FunctionType<T> = new (...args: any[]) => T;
export type VariantOrNull = Variant | null;

export interface SliceOptions {
  length?: number;
  srcType?: string;
  start?: number;
}

export interface ConvertOptions {
  bufferSize?: number;
  srcType?: string;
}

export type ConverterLocationFn = (srcType: string, dstType: string) => string;
export type HandlerLocationFn = (type: string) => string;

export interface Converter<ST extends Variant, DT extends Variant> {
  _convert(src: ST, bufferSize?: number): Promise<DT>;
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
  public abstract readonly name: string;

  public async isEmpty(src: T): Promise<boolean> {
    this.validate(src);
    return await this._isEmpty(src);
  }

  public async merge(src: T[], bufferSize?: number): Promise<T> {
    if (src == null) {
      throw new TypeError("src is null or undefined");
    }
    if (src.length === 0) {
      return await this.empty();
    }
    for (const chunk of src) {
      this.validate(chunk);
    }
    this.validateOption("bufferSize", bufferSize);

    return await this._merge(src, bufferSize);
  }

  public async size(src: T): Promise<number> {
    this.validate(src);
    return await this._size(src);
  }

  public async slice(src: T, options?: SliceOptions): Promise<T> {
    this.validate(src);
    this.validateOption("options.start", options?.start);
    this.validateOption("options.length", options?.length);

    if (options?.length === 0) {
      return await this.empty();
    }
    return await this._slice(src, options);
  }

  public abstract empty(): Promise<T>;

  protected validate(src: T): void {
    if (!this.validateSource(src)) {
      throw new TypeError(`src is not ${this.name}`);
    }
  }

  protected validateSource(src: T): boolean {
    return src != null && this._validateSource(src);
  }

  protected validateOption(name: string, value?: number): void {
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
  protected abstract _validateSource(src: T): boolean;
}
