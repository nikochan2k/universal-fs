/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Variant = object | number | boolean | bigint | string;
export type ExcludeString = object | number | boolean | bigint;
export type FunctionType<T> = new (...args: any[]) => T;
export type VariantOrNull = Variant | null;

export interface Options {
  bufferSize?: number;
  length: number;
  start: number;
}

export interface Converter<ST extends Variant, DT extends Variant> {
  convert(src: ST, options?: Partial<Options>): Promise<DT>;
}

export interface Handler<T extends Variant> {
  empty(): Promise<T>;
  isEmpty(src: T, options?: Partial<Options>): Promise<boolean>;
  pipe(
    src: T,
    dst: NodeJS.WritableStream | WritableStream<unknown>,
    options?: Partial<Options>
  ): Promise<void>;
  size(src: T, options?: Partial<Options>): Promise<number>;
  slice(src: T, options: Options): Promise<T>;
  merge(src: T[], options?: Partial<Options>): Promise<T>;
}
