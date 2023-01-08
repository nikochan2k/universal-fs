import { hasBuffer, newBuffer } from "../../supports/Environment.js";
import { AbstractConverter } from "../../UnivConv.js";
import type b2a from "./arraybuffer.js";

class BASE64_Uint8Array extends AbstractConverter<string, Uint8Array> {
  private b2a?: typeof b2a;

  public async _convert(src: string): Promise<Uint8Array> {
    if (hasBuffer) {
      return Buffer.from(src, "base64");
    }
    if (!this.b2a) {
      this.b2a = (await import("./arraybuffer.js")).default;
    }
    const ab = await this.b2a._convert(src);
    return newBuffer(ab);
  }
}

export default new BASE64_Uint8Array();
