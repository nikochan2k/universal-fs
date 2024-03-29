import type { Writable } from "stream";
import { DEFAULT_BUFFER_SIZE } from "./util.js";

export type Variant = object | number | boolean | bigint | string;
export type WritableLike = Writable | WritableStream;
export type ExcludeString = object | number | boolean | bigint;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FunctionType<T> = new (...args: any[]) => T;

export interface SliceOptions {
  length?: number;
  srcType?: string;
  start?: number;
}

export interface ConvertOptions {
  bufferSize?: number;
  srcType?: string;
  srcTextEncoding?: string;
  dstType?: string | FunctionType<Variant>;
  dstTextEncoding?: string;
  fetchRequestInit?: RequestInit;
}

export interface Converter<ST extends Variant, DT extends Variant> {
  convert(src: ST, options?: ConvertOptions): Promise<DT>;
}

export interface Manipulator<T extends Variant> {
  empty(): Promise<T>;
  isEmpty(src: T): Promise<boolean>;
  merge(src: T[], bufferSize?: number): Promise<T>;
  size(src: T): Promise<number>;
  slice(src: T, options?: SliceOptions): Promise<T>;
}

export abstract class AbstractManipulator<T extends Variant>
  implements Manipulator<T>
{
  public abstract readonly name: string;

  public async isEmpty(src: T): Promise<boolean> {
    this.validate(src);
    return await this._isEmpty(src);
  }

  public async merge(src: T[], bufferSize = DEFAULT_BUFFER_SIZE): Promise<T> {
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

  protected validateSource(src: unknown): src is T {
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
  protected abstract _merge(src: T[], bufferSize: number): Promise<T>;
  protected abstract _size(src: T): Promise<number>;
  protected abstract _slice(src: T, options?: SliceOptions): Promise<T>;
  protected abstract _validateSource(src: unknown): src is T;
}

export interface Writer<DT extends object> {
  write(src: Variant, dst: DT, options?: ConvertOptions): Promise<void>;
}
