import {
  Converter,
  ConvertOptions,
  ExcludeString,
  FunctionType,
  Handler,
  SliceOptions,
  Variant,
} from "./core.js";

const converterMap: { [key: string]: Converter<Variant, Variant> | null } = {};
const handlerMap: { [key: string]: Handler<Variant> | null } = {};

interface MergeOptions {
  bufferSize?: number;
  srcType?: string;
}

class UnivConv {
  convert<T extends Variant>(
    src: string,
    dstType: FunctionType<T>,
    options?: ConvertOptions
  ): Promise<T>;
  convert<T extends Variant>(
    src: string,
    dstType: string,
    options?: ConvertOptions
  ): Promise<T>;
  convert<T extends Variant>(
    src: ExcludeString,
    dstType: FunctionType<T>,
    options?: ConvertOptions
  ): Promise<T>;
  convert<T extends Variant>(
    src: ExcludeString,
    dstType: string,
    options?: ConvertOptions
  ): Promise<T>;
  async convert<T extends Variant>(
    src: Variant,
    dstType: string | FunctionType<T>,
    options?: ConvertOptions
  ): Promise<T> {
    const srcTypes = this.getSrcTypes(src, options?.srcType);
    let dstTypes: string[];
    if (typeof dstType === "function") {
      dstTypes = this.getTypes(dstType);
    } else {
      dstTypes = [dstType];
    }
    for (const st of srcTypes) {
      const srcType = st.toLowerCase();
      for (const dt of dstTypes) {
        const dstType = dt.toLowerCase();
        const key = srcType + "_" + dstType;
        let converter = converterMap[key];
        if (typeof converter === "undefined") {
          const location = `./converters/${srcType}/${dstType}`;
          try {
            // eslint-disable-next-line
            converter = (await import(location)).default;
            if (converter) {
              converterMap[key] = converter;
            }
          } catch {
            // NOOP
          }
          if (!converter) {
            converterMap[key] = null;
            console.debug("Not found: " + location);
            continue;
          }
        } else if (converter === null) {
          continue;
        }
        if (converter) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return (await converter.convert(src, options)) as Promise<T>;
        }
      }
    }
    throw new TypeError(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `No converter: srcTypes=[${srcTypes}], dstTypes=[${dstTypes}]`
    );
  }

  empty<T>(type: string): Promise<T>;
  empty<T>(obj: ExcludeString): Promise<T>;
  async empty<T>(v: Variant): Promise<T> {
    const handler = await this.getHandler(v);
    return (await handler.empty()) as Promise<T>;
  }

  async isEmpty<T extends Variant>(src: T): Promise<boolean> {
    const handler = await this.getHandler(src);
    return await handler.isEmpty(src);
  }

  async merge<T extends Variant>(src: T[], options?: MergeOptions): Promise<T> {
    const type = options?.srcType;
    if (src == null || (type == null && src.length === 0)) {
      throw new TypeError("src is null, undefined or empty");
    }
    const handler = await this.getHandler(type != null ? type : (src[0] as T));
    const merged = await handler.merge(src, options?.bufferSize);
    return merged as Promise<T>;
  }

  async size<T extends Variant>(src: T, srcType?: string): Promise<number> {
    const handler = await this.getHandler(srcType != null ? srcType : src);
    return await handler.size(src);
  }

  async slice<T extends Variant>(src: T, options?: SliceOptions): Promise<T> {
    const type = options?.srcType;
    const handler = await this.getHandler(type != null ? type : src);
    const sliced = await handler.slice(src, options);
    return sliced as Promise<T>;
  }

  protected getHandler<T extends Variant>(v: T): Promise<Handler<T>>;
  protected getHandler<T extends Variant>(
    fn: FunctionType<T>
  ): Promise<Handler<T>>;
  protected async getHandler<T extends Variant>(v: T): Promise<Handler<T>> {
    let types: string[] = [];
    const type = typeof v;
    switch (type) {
      case "bigint":
      case "boolean":
      case "number":
        types = [type];
        break;
      case "string":
        types = [v as string];
        break;
      case "function":
        types = this.getTypes(v as Function); // eslint-disable-line
        break;
      case "object":
        types = this.getTypes(v.constructor);
        break;
    }
    for (const type of types) {
      const key = type.toLowerCase();
      let handler = handlerMap[key];
      if (typeof handler === "undefined") {
        const location = `./handlers/${key}`;
        try {
          // eslint-disable-next-line
          handler = (await import(location)).default;
          if (handler) {
            handlerMap[key] = handler;
          }
        } catch {
          // NOOP
        }
        if (!handler) {
          handlerMap[key] = null;
          console.debug("Not found: " + location);
          continue;
        }
      } else if (handler === null) {
        continue;
      }
      if (handler) {
        return handler as Handler<T>;
      }
    }
    throw new TypeError(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `No handler: types=[${types}]`
    );
  }

  protected getSrcTypes(src: Variant, srcType?: string): string[] {
    const type = typeof src;
    switch (type) {
      case "bigint":
      case "boolean":
      case "number":
        return [type];
      case "string":
        return [srcType != null ? srcType : type];
      case "object":
        return this.getTypes(src.constructor);
      case "function":
        return this.getTypes(src as Function); // eslint-disable-line
    }
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new TypeError("src is " + src);
  }

  // eslint-disable-next-line
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

const UNIV_CONV = new UnivConv();

export abstract class AbstractConverter<ST extends Variant, DT extends Variant>
  implements Converter<ST, DT>
{
  public async convert(src: ST, options?: ConvertOptions): Promise<DT> {
    src = await UNIV_CONV.slice(src, options);
    return await this._convert(src, options?.bufferSize);
  }

  public abstract _convert(src: ST, bufferSize?: number): Promise<DT>;
}

export default UNIV_CONV;
