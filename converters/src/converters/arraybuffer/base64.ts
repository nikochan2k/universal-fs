import type { encode } from "base64-arraybuffer";
import { AbstractConverter } from "../../UnivConv";
import { hasBuffer } from "../../util";

class ArrayBuffer_BASE64 extends AbstractConverter<ArrayBufferLike, string> {
  private _encode?: typeof encode;

  protected async _convert(src: ArrayBufferLike): Promise<string> {
    if (hasBuffer) {
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
