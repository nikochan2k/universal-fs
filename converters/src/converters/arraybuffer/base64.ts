import type { encode } from "base64-arraybuffer";
import { hasBuffer, newBuffer } from "../../supports/Environment.js";
import { AbstractConverter } from "../../UnivConv.js";

class ArrayBuffer_BASE64 extends AbstractConverter<ArrayBuffer, string> {
  private encode?: typeof encode;

  public async _convert(src: ArrayBuffer): Promise<string> {
    if (hasBuffer) {
      return newBuffer(src).toString("base64");
    }
    if (!this.encode) {
      this.encode = (await import("base64-arraybuffer")).encode;
    }
    return this.encode(src);
  }
}

export default new ArrayBuffer_BASE64();
