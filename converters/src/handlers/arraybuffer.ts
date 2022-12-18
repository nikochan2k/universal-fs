import { AbstractHandler, SliceOptions } from "../core";

export const EMPTY_ARRAY_BUFFER = new ArrayBuffer(0);

class ArrayBufferHandler extends AbstractHandler<ArrayBuffer> {
  public empty(): Promise<ArrayBuffer> {
    return Promise.resolve(EMPTY_ARRAY_BUFFER);
  }

  protected _isEmpty(src: ArrayBuffer): Promise<boolean> {
    return Promise.resolve(src.byteLength === 0);
  }

  protected _merge(src: ArrayBuffer[]): Promise<ArrayBuffer> {
    const byteLength = src.reduce((sum, chunk) => {
      return sum + chunk.byteLength;
    }, 0);
    const u8 = new Uint8Array(byteLength);
    let pos = 0;
    for (const chunk of src) {
      u8.set(new Uint8Array(chunk), pos);
      pos += chunk.byteLength;
    }
    return Promise.resolve(u8.buffer);
  }

  protected _size(src: ArrayBuffer): Promise<number> {
    return Promise.resolve(src.byteLength);
  }

  protected _slice(
    src: ArrayBuffer,
    options?: SliceOptions
  ): Promise<ArrayBuffer> {
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

  protected _validateSource(src: ArrayBuffer): void {
    if (!(src instanceof ArrayBuffer)) {
      throw new TypeError("src is not ArrayBuffer");
    }
  }
}

export default new ArrayBufferHandler();
