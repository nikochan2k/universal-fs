// eslint-disable-next-line @typescript-eslint/ban-types
export type Variant = object | number | boolean | bigint | string;
// eslint-disable-next-line @typescript-eslint/ban-types
export type ExcludeString = object | number | boolean | bigint;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FunctionType<T> = new (...args: any[]) => T;

export interface Options {
  bufferSize?: number;
  length: number;
  start: number;
}

export interface Converter<ST extends Variant, DT extends Variant> {
  srcType: string;
  dstType: string;

  convert(src: ST, options?: Partial<Options>): Promise<DT>;
}

export interface Handler<T extends Variant> {
  type: string;
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
