import { AbstractHandler, SliceOptions } from "../core";

export const EMPTY_UINT8_ARRAY = new Uint8Array(0);

class Uint8ArrayHandler extends AbstractHandler<Uint8Array> {
  public empty(): Promise<Uint8Array> {
    return Promise.resolve(EMPTY_UINT8_ARRAY);
  }

  protected _isEmpty(src: Uint8Array): Promise<boolean> {
    return Promise.resolve(src.byteLength === 0);
  }

  protected _merge(src: Uint8Array[]): Promise<Uint8Array> {
    const byteLength = src.reduce((sum, chunk) => {
      return sum + chunk.byteLength;
    }, 0);
    const u8 = new Uint8Array(byteLength);
    let pos = 0;
    for (const chunk of src) {
      u8.set(chunk, pos);
      pos += chunk.byteLength;
    }
    return Promise.resolve(u8);
  }

  protected _size(src: Uint8Array): Promise<number> {
    return Promise.resolve(src.length);
  }

  protected _slice(
    src: Uint8Array,
    options?: SliceOptions
  ): Promise<Uint8Array> {
    const start = options?.start ?? 0;
    let end: number | undefined;
    if (options?.length != null) {
      end = start + options.length;
      if (src.length < end) {
        end = src.length;
      }
    }
    const sliced = src.slice(start, end);
    return Promise.resolve(sliced);
  }

  protected _validateSource(src: Uint8Array): void {
    if (!(src instanceof Uint8Array)) {
      throw new TypeError("src is not Uint8Array");
    }
  }
}

export default new Uint8ArrayHandler();
