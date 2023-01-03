import { decode, encode } from "base64-arraybuffer";
import { SliceOptions } from "../core.js";
import { StringHandler } from "../supports/handlers/StringHandler.js";
import type ah from "./arraybuffer.js";

export const EMPTY_BASE64 = "";

class BASE64Handler extends StringHandler {
  private ah?: typeof ah;
  public name = "BASE64";

  protected async _merge(src: string[]): Promise<string> {
    const chunks: ArrayBuffer[] = [];
    for (const chunk of src) {
      const ab = decode(chunk);
      chunks.push(ab);
    }
    if (!this.ah) {
      this.ah = (await import("./arraybuffer.js")).default;
    }
    const merged = await this.ah.merge(chunks);
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
    if (!this.ah) {
      this.ah = (await import("./arraybuffer.js")).default;
    }
    const sliced = await this.ah.slice(ab, options);
    const base64 = encode(sliced);
    return Promise.resolve(base64);
  }
}

export default new BASE64Handler();
