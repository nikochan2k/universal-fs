import {
  Converter,
  ConvertOptions,
  ExcludeString,
  FunctionType,
  Manipulator,
  SliceOptions,
  Variant,
  Writer,
} from "./core.js";
import { DEFAULT_BUFFER_SIZE } from "./util.js";

const converterMap: { [key: string]: Converter<Variant, Variant> | null } = {};
const manipulatorMap: { [key: string]: Manipulator<Variant> | null } = {};
const writerMap: { [key: string]: Writer<object> | null } = {};

interface MergeOptions {
  bufferSize?: number;
  srcType?: string;
}

class UnivConv {
  async convert<T extends Variant>(
    src: Variant,
    dstType: string | FunctionType<T>,
    options?: ConvertOptions
  ): Promise<T> {
    const opts = { ...options, dstType };
    const srcTypes = this.getSrcTypes(src, opts?.srcType);
    let dstTypes: string[];
    if (typeof dstType === "function") {
      dstTypes = this.getTypes(dstType);
    } else {
      dstTypes = [dstType];
    }

    // Check the same type
    for (const st of srcTypes) {
      const srcType = this.createKey(st);
      for (const dt of dstTypes) {
        const dstType = this.createKey(dt);
        if (srcType === dstType) {
          return src as T;
        }
      }
    }

    srcTypes.push("any");
    dstTypes.push("any");
    for (const st of srcTypes) {
      const srcTypeKey = this.createKey(st);
      for (const dt of dstTypes) {
        const dstTypeKey = this.createKey(dt);
        const key = srcTypeKey + "_" + dstTypeKey;
        let converter = converterMap[key];
        if (typeof converter === "undefined") {
          const location = `./converters/${srcTypeKey}/${dstTypeKey}.js`;
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
          return (await converter.convert(src, opts)) as Promise<T>;
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
    const manipulator = await this.getManipulator(v);
    return (await manipulator.empty()) as Promise<T>;
  }

  async isEmpty<T extends Variant>(src: T): Promise<boolean> {
    const manipulator = await this.getManipulator(src);
    return await manipulator.isEmpty(src);
  }

  async merge<T extends Variant>(src: T[], options?: MergeOptions): Promise<T> {
    const type = options?.srcType;
    if (src == null || (type == null && src.length === 0)) {
      throw new TypeError("src is null, undefined or empty");
    }
    const manipulator = await this.getManipulator(
      type != null ? type : (src[0] as T)
    );
    const merged = await manipulator.merge(src, options?.bufferSize);
    return merged as Promise<T>;
  }

  async size<T extends Variant>(src: T, srcType?: string): Promise<number> {
    const manipulator = await this.getManipulator(
      srcType != null ? srcType : src
    );
    return await manipulator.size(src);
  }

  async slice<T extends Variant>(src: T, options?: SliceOptions): Promise<T> {
    const type = options?.srcType;
    const manipulator = await this.getManipulator(type != null ? type : src);
    const sliced = await manipulator.slice(src, options);
    return sliced as Promise<T>;
  }

  async write<T extends object>(
    src: Variant,
    dst: T,
    options?: ConvertOptions
  ) {
    const writer = await this.getWriter(dst);
    await writer.write(src, dst, options);
  }

  private createKey(type: string) {
    type = type.toLowerCase();
    type = type.replace(/[a-z0-9]/, "");
    return type;
  }

  private getManipulator<T extends Variant>(v: T): Promise<Manipulator<T>>;
  private getManipulator<T extends Variant>(
    fn: FunctionType<T>
  ): Promise<Manipulator<T>>;
  private async getManipulator<T extends Variant>(
    v: T
  ): Promise<Manipulator<T>> {
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
      const key = this.createKey(type);
      let manipulator = manipulatorMap[key];
      if (typeof manipulator === "undefined") {
        const location = `./manipulators/${key}.js`;
        try {
          // eslint-disable-next-line
          manipulator = (await import(location)).default;
          if (manipulator) {
            manipulatorMap[key] = manipulator;
          }
        } catch {
          // NOOP
        }
        if (!manipulator) {
          manipulatorMap[key] = null;
          console.debug("Not found: " + location);
          continue;
        }
      } else if (manipulator === null) {
        continue;
      }
      if (manipulator) {
        return manipulator as Manipulator<T>;
      }
    }
    throw new TypeError(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `No manipulator: types=[${types}]`
    );
  }

  private getSrcTypes(src: Variant, srcType?: string): string[] {
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
  private getTypes(fn: Function): string[] {
    const types: string[] = [];
    while (fn) {
      const type = fn.name;
      types.push(type);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parent = Object.getPrototypeOf(fn);
      // eslint-disable-next-line
      const name = parent?.name;
      if (name && name !== "Object" && name !== "EventEmitter") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        fn = parent;
      } else {
        break;
      }
    }
    return types;
  }

  private async getWriter<T extends object>(v: T): Promise<Writer<T>> {
    const types = this.getTypes(v.constructor);
    for (const type of types) {
      const key = this.createKey(type);
      let writer = writerMap[key];
      if (typeof writer === "undefined") {
        const location = `./writers/${key}.js`;
        try {
          // eslint-disable-next-line
          writer = (await import(location)).default;
          if (writer) {
            writerMap[key] = writer;
          }
        } catch {
          // NOOP
        }
        if (!writer) {
          writerMap[key] = null;
          console.debug("Not found: " + location);
          continue;
        }
      } else if (writer === null) {
        continue;
      }
      if (writer) {
        return writer as Writer<T>;
      }
    }
    throw new TypeError(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `No writer: types=[${types}]`
    );
  }
}

const UNIV_CONV = new UnivConv();

export abstract class AbstractConverter<ST extends Variant, DT extends Variant>
  implements Converter<ST, DT>
{
  public async convert(src: ST, options?: ConvertOptions): Promise<DT> {
    return await this._convert(src, options?.bufferSize ?? DEFAULT_BUFFER_SIZE);
  }

  public abstract _convert(src: ST, bufferSize: number): Promise<DT>;
}

export default UNIV_CONV;
