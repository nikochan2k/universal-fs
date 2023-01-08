import { AbstractConverter } from "../../UnivConv.js";
import type b2a from "./arraybuffer.js";
import type a2b from "../arraybuffer/base64.js";

class Binary_BASE64 extends AbstractConverter<string, string> {
  private b2a?: typeof b2a;
  private a2b?: typeof a2b;

  public async _convert(src: string): Promise<string> {
    if (typeof btoa === "function") {
      return btoa(src);
    }
    if (!this.b2a) {
      this.b2a = (await import("./arraybuffer.js")).default;
    }
    const ab = await this.b2a._convert(src);
    if (!this.a2b) {
      this.a2b = (await import("../arraybuffer/base64.js")).default;
    }
    const base64 = await this.a2b._convert(ab);
    return base64;
  }
}

export default new Binary_BASE64();
