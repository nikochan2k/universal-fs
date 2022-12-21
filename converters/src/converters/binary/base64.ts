import { AbstractConverter } from "../../UnivConv";
import b2a from "./arraybuffer";
import a2b from "../arraybuffer/base64";

class Binary_BASE64 extends AbstractConverter<string, string> {
  public async _convert(src: string): Promise<string> {
    if (typeof btoa === "function") {
      return btoa(src);
    }
    const ab = await b2a._convert(src);
    const base64 = await a2b._convert(ab);
    return base64;
  }
}

export default new Binary_BASE64();
