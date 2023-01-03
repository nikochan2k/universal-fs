import { AbstractConverter } from "../../UnivConv";
import type u2b from "../uint8array/binary";
import type b2u from "./uint8array";

class BASE64_Binary extends AbstractConverter<string, string> {
  private u2b?: typeof u2b;
  private b2u?: typeof b2u;

  public async _convert(src: string): Promise<string> {
    if (typeof atob === "function") {
      return atob(src);
    }
    if (!this.u2b) {
      this.u2b = (await import("../uint8array/binary")).default;
    }
    if (!this.b2u) {
      this.b2u = (await import("./uint8array")).default;
    }
    const u8 = await this.b2u._convert(src);
    const binary = await this.u2b._convert(u8);
    return binary;
  }
}

export default new BASE64_Binary();
