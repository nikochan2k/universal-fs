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
  public abstract empty(): Promise<T>;

  public async isEmpty(src: T, options?: Options): Promise<boolean> {
    if (!src || options?.length === 0) {
      return true;
    }
    src = await this.slice(src, options);
    return await this._isEmpty(src);
  }

  public async merge(src: T[], options?: Options): Promise<T> {
    if (!src || src.length === 0) {
      return await this.empty();
    }
    const merged = await this._merge(src, options?.bufferSize);
    return await this.slice(merged, options);
  }

  public async pipe(
    src: T,
    dst: NodeJS.WritableStream | WritableStream<unknown>,
    options?: Options
  ): Promise<void> {
    if (!src || options?.length === 0) {
      return;
    }
    src = await this.slice(src, options);
    return await this._pipe(src, dst, options?.bufferSize);
  }

  public async size(src: T, options?: Options): Promise<number> {
    if (!src || options?.length === 0) {
      return 0;
    }
    src = await this.slice(src, options);
    return await this._size(src, options?.bufferSize);
  }

  public async slice(src: T, options?: Options): Promise<T> {
    if (options?.start == null && options?.length == null) {
      return src;
    }
    if (options?.length === 0) {
      return await this.empty();
    }
    return await this._slice(src, options?.bufferSize);
  }

  protected abstract _isEmpty(src: T): Promise<boolean>;
  protected abstract _merge(src: T[], bufferSize?: number): Promise<T>;
  protected abstract _pipe(
    src: T,
    dst: NodeJS.WritableStream | WritableStream<unknown>,
    bufferSize?: number
  ): Promise<void>;
  protected abstract _size(src: T, bufferSize?: number): Promise<number>;
  protected abstract _slice(src: T, bufferSize?: number): Promise<T>;
}
