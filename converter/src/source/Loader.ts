import type { Readable } from "stream";
import { getType } from "../converters";

export type BufferLike = ArrayBufferLike | Uint8Array | Blob;
export type ReadableLike = NodeJS.ReadableStream | ReadableStream<unknown>;
export type WritableLike = NodeJS.WritableStream | WritableStream<unknown>;
export type Binary = BufferLike | ReadableLike;
export type Data = string | Binary;

export type BufferType = "arraybuffer" | "uint8array" | "blob";
export type ReadableType = "readable" | "readablestream";
export type BinaryType = BufferType | ReadableType;
export type StringType = "string";
export type DataType = StringType | BinaryType;

export type DataOf<T extends string> = T extends "arraybuffer"
  ? ArrayBufferLike
  : T extends "uint8array"
  ? Uint8Array
  : T extends "blob"
  ? Blob
  : T extends "readable"
  ? Readable
  : T extends "readablestream"
  ? ReadableStream<unknown>
  : string;

export type TypeOf<T extends Data> = T extends ArrayBufferLike
  ? "arraybuffer"
  : T extends Uint8Array
  ? "uint8array"
  : T extends Blob
  ? "blob"
  : T extends NodeJS.ReadableStream
  ? "readable"
  : T extends ReadableStream
  ? "readablestream"
  : "string";

export interface LoaderOptions {
  encoding?: string;
  length?: number;
  start?: number;
}

export interface Converter<D extends Data> {
  data: () => Promise<D>;
  pipe: (writable: WritableLike) => void;
  slice: (start: number, length?: number) => Converter<D>;
  to: <DT extends DataType>(
    type: DT,
    encoding?: string
  ) => Promise<Converter<DataOf<DT>>>;
}

export interface Loader<D extends Data> {
  load(input: Data): Promise<Converter<D>>;
}

export class Loaders {
  private importers: { [className: string]: () => Promise<Loader<Data>> } = {};
  private loaders: { [className: string]: Loader<Data> } = {};

  public addImporter(
    className: string,
    importLoader: () => Promise<Loader<Data>>
  ) {
    this.importers[className] = importLoader;
  }

  public removeImporter(className: string) {
    delete this.loaders[className];
    delete this.importers[className];
  }

  public async load<D extends Data>(input: D) {
    const loader = await this.getLoader(input.constructor);
    if (!loader) {
      throw new Error(`Not suppoted type: ${getType(input)}`);
    }
    return await (loader.load(input) as Promise<Converter<D>>);
  }

  /* eslint-disable */
  protected async getLoader(targetClass: Function) {
    while (targetClass) {
      const className = targetClass.name;
      const loader = this.loaders[className];
      if (loader) {
        return loader;
      }
      const importLoader = this.importers[className];
      if (importLoader) {
        const loader = await importLoader();
        this.loaders[className] = loader;
        return loader;
      }
      const parentClass = Object.getPrototypeOf(targetClass);
      if (parentClass && parentClass !== Object && parentClass.name) {
        targetClass = parentClass;
      } else {
        break;
      }
    }

    return undefined;
  }
  /* eslint-enable */
}
