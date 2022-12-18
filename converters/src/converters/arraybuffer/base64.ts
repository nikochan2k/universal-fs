import type { encode } from "base64-arraybuffer";
import { AbstractConverter } from "../../UnivConv";

class ArrayBuffer_BASE64 extends AbstractConverter<ArrayBuffer, string> {
  private _encode: typeof encode | undefined;

  protected async _convert(src: ArrayBuffer): Promise<string> {
    if (!this._encode) {
      this._encode = (await import("base64-arraybuffer")).encode;
    }
    const base64 = this._encode(src);
    return base64;
  }
}

export default new ArrayBuffer_BASE64();
