export type ExcludeString = object | number | boolean | bigint | symbol;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FunctionType<T> = new (...args: any[]) => T;

export interface Options {
  bufferSize?: number;
  length?: number;
  start?: number;
}

export interface StringSourceOptions extends Options {
  srcType?: string;
}

export interface Converter {
  convertTo<T>(
    src: string,
    dstType: FunctionType<T>,
    options?: StringSourceOptions
  ): Promise<T>;
  convertTo<T extends ExcludeString>(
    src: ExcludeString,
    dstType: FunctionType<T>,
    options?: Options
  ): Promise<T>;
  convertToString(
    src: ExcludeString,
    dstType: string,
    options?: Options
  ): Promise<string>;
  convertToString(
    src: string,
    dstType: string,
    options?: StringSourceOptions
  ): Promise<string>;
}
