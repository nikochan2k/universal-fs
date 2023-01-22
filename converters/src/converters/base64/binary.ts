import UNIV_CONV, { AbstractConverter } from "../../UnivConv.js";
import type b2u from "./uint8array.js";

class BASE64_Binary extends AbstractConverter<string, string> {
  private b2u?: typeof b2u;

  public async _convert(src: string): Promise<string> {
    if (typeof atob === "function") {
      return atob(src);
    }
    if (!this.b2u) {
      this.b2u = (await import("./uint8array.js")).default;
    }
    const u8 = await this.b2u.convert(src);
    return await UNIV_CONV.convert(u8, "binary");
  }
}

export default new BASE64_Binary();
