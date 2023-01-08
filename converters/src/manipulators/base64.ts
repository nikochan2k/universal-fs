import type { decode, encode } from "base64-arraybuffer";
import { SliceOptions } from "../core.js";
import { StringManipulator } from "../supports/manipulators/StringManipulator.js";
import type ah from "./arraybuffer.js";

export const EMPTY_BASE64 = "";

class BASE64Manipulator extends StringManipulator {
  private ah?: typeof ah;
  private decode?: typeof decode;
  private encode?: typeof encode;
  public name = "BASE64";

  private async importModule() {
    if (!this.decode || !this.encode) {
      const module = await import("base64-arraybuffer");
      this.decode = module.decode;
      this.encode = module.encode;
    }
  }

  protected async _merge(src: string[]): Promise<string> {
    await this.importModule();
    const chunks: ArrayBuffer[] = [];
    for (const chunk of src) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const ab = this.decode!(chunk);
      chunks.push(ab);
    }
    if (!this.ah) {
      this.ah = (await import("./arraybuffer.js")).default;
    }
    const merged = await this.ah.merge(chunks);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const base64 = this.encode!(merged);
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
    await this.importModule();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ab = this.decode!(src);
    if (!this.ah) {
      this.ah = (await import("./arraybuffer.js")).default;
    }
    const sliced = await this.ah.slice(ab, options);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const base64 = this.encode!(sliced);
    return Promise.resolve(base64);
  }
}

export default new BASE64Manipulator();
