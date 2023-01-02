import { AbstractHandler, SliceOptions } from "../core";
import { newBuffer } from "../util";

export const EMPTY_ARRAY_BUFFER = new ArrayBuffer(0);

class ArrayBufferHandler extends AbstractHandler<ArrayBufferLike> {
  public name = ArrayBuffer.name;

  public empty(): Promise<ArrayBufferLike> {
    return Promise.resolve(EMPTY_ARRAY_BUFFER);
  }

  protected _isEmpty(src: ArrayBufferLike): Promise<boolean> {
    return Promise.resolve(src.byteLength === 0);
  }

  protected _merge(src: ArrayBufferLike[]): Promise<ArrayBufferLike> {
    const byteLength = src.reduce((sum, chunk) => {
      return sum + chunk.byteLength;
    }, 0);
    const u8 = newBuffer(byteLength);
    let pos = 0;
    for (const chunk of src) {
      u8.set(newBuffer(chunk), pos);
      pos += chunk.byteLength;
    }
    return Promise.resolve(u8.buffer);
  }

  protected _size(src: ArrayBufferLike): Promise<number> {
    return Promise.resolve(src.byteLength);
  }

  protected _slice(
    src: ArrayBufferLike,
    options?: SliceOptions
  ): Promise<ArrayBufferLike> {
    const start = options?.start ?? 0;
    let end: number | undefined;
    if (options?.length != null) {
      end = start + options.length;
      if (src.byteLength < end) {
        end = src.byteLength;
      }
    }
    const sliced = src.slice(start, end);
    return Promise.resolve(sliced);
  }

  protected _validateSource(src: ArrayBufferLike): boolean {
    return src instanceof ArrayBuffer || src instanceof SharedArrayBuffer;
  }
}

export default new ArrayBufferHandler();
