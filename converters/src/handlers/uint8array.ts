import { AbstractHandler, SliceOptions } from "../core";
import support from "../supports/TypedArray";

export const EMPTY_UINT8_ARRAY = new Uint8Array(0);

class Uint8ArrayHandler extends AbstractHandler<Uint8Array> {
  public name = Uint8Array.name;

  public empty(): Promise<Uint8Array> {
    return Promise.resolve(EMPTY_UINT8_ARRAY);
  }

  protected _isEmpty(src: Uint8Array): Promise<boolean> {
    return support.isEmpty(src);
  }

  protected _merge(src: Uint8Array[]): Promise<Uint8Array> {
    return support.merge(src, (length) => new Uint8Array(length));
  }

  protected _size(src: Uint8Array): Promise<number> {
    return support.size(src);
  }

  protected _slice(
    src: Uint8Array,
    options?: SliceOptions
  ): Promise<Uint8Array> {
    return support.slice(src, options);
  }

  protected _validateSource(src: Uint8Array): boolean {
    return src instanceof Uint8Array;
  }
}

export default new Uint8ArrayHandler();
