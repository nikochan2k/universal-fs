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

const converterDirectories = ["./converters/"];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const converterMap: { [key: string]: Converter<any, any> | null } = {};
const handlerDirectories = ["./handlers/"];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          for (let dir of converterDirectories) {
            if (!dir.endsWith("/")) {
              dir += "/";
            }
            try {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              converter = await import(dir + key);
              if (converter) {
                break;
              }
            } catch {
              // NOOP
            }
          }
          if (!converter) {
            converterMap[key] = null;
            continue;
          }
        } else if (typeof converter === null) {
          continue;
        }
        if (converter) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return await converter.convert(src, options);
        }
      }
    }
    throw new TypeError(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `No converters: srcTypes=[${srcTypes}], dstTypes=[${dstTypes}]`
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
        // eslint-disable-next-line @typescript-eslint/ban-types
        return this.getTypes(src as Function);
    }
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new TypeError("src is " + src);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  protected getTypes(fn: Function): string[] {
    const types: string[] = [];
    while (fn) {
      const type = fn.name;
      types.push(type);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parent = Object.getPrototypeOf(fn);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (parent && parent !== Object && parent.name) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        fn = parent;
      } else {
        break;
      }
    }
    return types;
  }
}
