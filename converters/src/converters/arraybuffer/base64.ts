import type { encode } from "base64-arraybuffer";
import { AbstractConverter } from "../../UnivConv";

class ArrayBuffer_BASE64 extends AbstractConverter<ArrayBuffer, string> {
  private _encode?: typeof encode;

  protected async _convert(src: ArrayBuffer): Promise<string> {
    if (typeof Buffer === "function") {
      return Buffer.from(src).toString("base64");
    }
    if (!this._encode) {
      this._encode = (await import("base64-arraybuffer")).encode;
    }
    const base64 = this._encode(src);
    return base64;
  }
}

export default new ArrayBuffer_BASE64();
