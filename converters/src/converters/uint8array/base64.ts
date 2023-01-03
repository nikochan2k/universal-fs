import { AbstractConverter } from "../../UnivConv.js";
import type a2b from "../arraybuffer/base64.js";

class Uint8Array_BASE64 extends AbstractConverter<Uint8Array, string> {
  private a2b?: typeof a2b;

  public async _convert(src: Uint8Array): Promise<string> {
    const ab = src.buffer.slice(
      src.byteOffset,
      src.byteOffset + src.byteLength
    );
    if (!this.a2b) {
      this.a2b = (await import("../arraybuffer/base64.js")).default;
    }
    const base64 = await this.a2b._convert(ab);
    return base64;
  }
}

export default new Uint8Array_BASE64();
