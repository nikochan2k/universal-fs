import {
  Variant,
  ExcludeString,
  FunctionType,
  Options,
  Converter,
  Handler,
} from "./core";

export interface StringOptions extends Partial<Options> {
  srcType?: string;
}

const converterMap: { [key: string]: Converter<any, any> | null } = {};
const handlerMap: { [key: string]: Handler<any> | null } = {};

export class UnivConv {
  convert<T>(
    src: string,
    dstType: FunctionType<T>,
    options?: StringOptions
  ): Promise<T>;
  convert<T>(src: string, dstType: string, options?: StringOptions): Promise<T>;
  convert<T>(
    src: ExcludeString,
    dstType: FunctionType<T>,
    options?: Partial<Options>
  ): Promise<T>;
  convert<T>(
    src: ExcludeString,
    dstType: string,
    options?: Partial<Options>
  ): Promise<T>;
  async convert<T>(
    src: Variant,
    dstType: string | FunctionType<T>,
    options?: StringOptions
  ): Promise<T> {
    const srcTypes = this.getSrcTypes(src);
    let dstTypes: string[];
    if (typeof dstType === "function") {
      dstTypes = this.getTypes(dstType);
    } else {
      dstTypes = [dstType];
    }
    for (const st of srcTypes) {
      for (const dt of dstTypes) {
        const key = st + "_" + dt;
        let converter = converterMap[key];
        if (typeof converter === "undefined") {
          try {
            converter = await import("./converters/" + key);
          } catch {}
          if (!converter) {
            converterMap[key] = null;
            continue;
          }
        } else if (typeof converter === null) {
          continue;
        }
        if (converter) {
          return await converter.convert(src, options);
        }
      }
    }
    throw new TypeError(
      `No converters: srcTypes=${srcTypes}, dstTypes=${dstTypes}`
    );
  }

  protected getSrcTypes(src: Variant): string[] {
    const type = typeof src;
    switch (type) {
      case "bigint":
      case "boolean":
      case "number":
      case "object":
      case "string":
        return [type];
      case "function":
        return this.getTypes(src as Function);
    }
    throw new TypeError("src is " + src);
  }

  protected getTypes(fn: Function): string[] {
    const types: string[] = [];
    while (fn) {
      const type = fn.name;
      types.push(type);
      const parent = Object.getPrototypeOf(fn);
      if (parent && parent !== Object && parent.name) {
        fn = parent;
      } else {
        break;
      }
    }
    return types;
  }
}
