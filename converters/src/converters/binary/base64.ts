import UNIV_CONV, { AbstractConverter } from "../../UnivConv.js";
import type b2a from "./arraybuffer.js";

class Binary_BASE64 extends AbstractConverter<string, string> {
  private b2a?: typeof b2a;

  public async _convert(src: string): Promise<string> {
    if (typeof btoa === "function") {
      return btoa(src);
    }
    if (!this.b2a) {
      this.b2a = (await import("./arraybuffer.js")).default;
    }
    const ab = await this.b2a._convert(src);
    const base64: string = await UNIV_CONV.convert(ab, "base64");
    return base64;
  }
}

export default new Binary_BASE64();
