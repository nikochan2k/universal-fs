import { AbstractManipulator, SliceOptions } from "../../core.js";
import { newBuffer } from "../Environment.js";

export abstract class ArrayBufferLikeManipulator<
  T extends ArrayBufferLike
> extends AbstractManipulator<ArrayBufferLike> {
  protected _isEmpty(src: T): Promise<boolean> {
    return Promise.resolve(src.byteLength === 0);
  }

  protected _merge(src: T[]): Promise<T> {
    const byteLength = src.reduce((sum, chunk) => {
      return sum + chunk.byteLength;
    }, 0);
    const abl = this.newArrayBufferLike(byteLength);
    const u8 = newBuffer(abl);
    let pos = 0;
    for (const chunk of src) {
      u8.set(newBuffer(chunk), pos);
      pos += chunk.byteLength;
    }
    return Promise.resolve(u8.buffer as T);
  }

  protected _size(src: T): Promise<number> {
    return Promise.resolve(src.byteLength);
  }

  protected _slice(src: T, options?: SliceOptions): Promise<T> {
    const start = options?.start ?? 0;
    let end: number | undefined;
    if (options?.length != null) {
      end = start + options.length;
      if (src.byteLength < end) {
        end = src.byteLength;
      }
    }
    const sliced = src.slice(start, end);
    return Promise.resolve(sliced as T);
  }

  protected abstract newArrayBufferLike(byteLength: number): T;
}
