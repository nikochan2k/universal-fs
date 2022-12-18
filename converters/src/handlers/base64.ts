import { AbstractHandler, SliceOptions } from "../core";
import UNIV_CONV from "../UnivConv";

export const EMPTY_BASE64 = "";

class BASE64Handler extends AbstractHandler<string> {
  public empty(): Promise<string> {
    return Promise.resolve(EMPTY_BASE64);
  }

  protected _isEmpty(src: string): Promise<boolean> {
    return Promise.resolve(src.length === 0);
  }

  protected async _merge(src: string[]): Promise<string> {
    const chunks: Uint8Array[] = [];
    for (const chunk of src) {
      const u8 = await UNIV_CONV.convert(chunk, Uint8Array, {
        srcType: "base64",
      });
      chunks.push(u8);
    }
    const merged = await UNIV_CONV.merge(chunks);
    const base64: string = await UNIV_CONV.convert(merged, "base64");
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
    const ab = await UNIV_CONV.convert(src, ArrayBuffer, { srcType: "base64" });
    const sliced = await UNIV_CONV.slice(ab, options);
    const base64: string = await UNIV_CONV.convert(sliced, "base64");
    return Promise.resolve(base64);
  }

  protected _validateSource(src: string): void {
    if (typeof src !== "string") {
      throw new TypeError("src is not string");
    }
  }
}

export default new BASE64Handler();
