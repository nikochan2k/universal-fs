import { SliceOptions } from "../core";

class TypedArraySupport {
  public isEmpty(src: NodeJS.TypedArray) {
    return Promise.resolve(src.length === 0);
  }

  public merge<T extends NodeJS.TypedArray>(
    src: T[],
    newTypedArray: (length: number) => T
  ): Promise<T> {
    const length = src.reduce((sum, chunk) => {
      return sum + chunk.length;
    }, 0);
    const ta = newTypedArray(length);
    let pos = 0;
    for (const chunk of src) {
      // eslint-disable-next-line
      ta.set(chunk as any, pos);
      pos += chunk.length;
    }
    return Promise.resolve(ta);
  }

  public size(src: NodeJS.TypedArray): Promise<number> {
    return Promise.resolve(src.length);
  }

  public slice<T extends NodeJS.TypedArray>(
    src: T,
    options?: SliceOptions
  ): Promise<T> {
    const start = options?.start ?? 0;
    let end: number | undefined;
    if (options?.length != null) {
      end = start + options.length;
      if (src.length < end) {
        end = src.length;
      }
    }
    const sliced = src.slice(start, end);
    return Promise.resolve(sliced as T);
  }
}

export default new TypedArraySupport();
