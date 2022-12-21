import { AbstractConverter } from "../../UnivConv";
import u2b from "../uint8array/binary";
import b2u from "./uint8array";

class BASE64_Binary extends AbstractConverter<string, string> {
  public async _convert(src: string): Promise<string> {
    if (typeof atob === "function") {
      return atob(src);
    }
    const u8 = await b2u._convert(src);
    const binary = await u2b._convert(u8);
    return binary;
  }
}

export default new BASE64_Binary();
