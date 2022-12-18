import { decode, encode } from "base64-arraybuffer";
import { AbstractHandler, SliceOptions } from "../core";
import abc from "./arraybuffer";

export const EMPTY_BASE64 = "";

class BASE64Handler extends AbstractHandler<string> {
  public empty(): Promise<string> {
    return Promise.resolve(EMPTY_BASE64);
  }

  protected _isEmpty(src: string): Promise<boolean> {
    return Promise.resolve(src.length === 0);
  }

  protected async _merge(src: string[]): Promise<string> {
    const chunks: ArrayBuffer[] = [];
    for (const chunk of src) {
      const ab = decode(chunk);
      chunks.push(ab);
    }
    const merged = await abc.merge(chunks);
    const base64 = encode(merged);
    return Promise.resolve(base64);
  }

  protected _size(src: string): Promise<number> {
    const len = src.length;
    const baseLen = (len * 3) / 4;
    let padding = 0;
    for (let i = len - 1; src[i] === "="; i--) {
      padding++;
    }
    const size = baseLen - padding;
    return Promise.resolve(size);
  }

  protected async _slice(src: string, options?: SliceOptions): Promise<string> {
    const ab = decode(src);
    const sliced = await abc.slice(ab, options);
    const base64 = encode(sliced);
    return Promise.resolve(base64);
  }

  protected _validateSource(src: string): void {
    if (typeof src !== "string") {
      throw new TypeError("src is not string");
    }
  }
}

export default new BASE64Handler();
