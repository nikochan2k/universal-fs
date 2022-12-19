import type { encode } from "base64-arraybuffer";
import { AbstractConverter } from "../../UnivConv";

class Uint8Array_BASE64 extends AbstractConverter<Uint8Array, string> {
  private _encode?: typeof encode;

  protected async _convert(src: Uint8Array): Promise<string> {
    if (!this._encode) {
      this._encode = (await import("base64-arraybuffer")).encode;
    }
    const ab = src.buffer.slice(
      src.byteOffset,
      src.byteOffset + src.byteLength
    );
    const base64 = this._encode(ab);
    return base64;
  }
}

export default new Uint8Array_BASE64();
