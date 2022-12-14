import type { decode } from "base64-arraybuffer";
import { hasBuffer } from "../../supports/Environment.js";
import { AbstractConverter } from "../../UnivConv.js";

class BASE64_ArrayBuffer extends AbstractConverter<string, ArrayBuffer> {
  private _decode?: typeof decode;

  public async _convert(src: string): Promise<ArrayBuffer> {
    if (hasBuffer) {
      const buffer = Buffer.from(src, "base64");
      return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );
    }
    if (!this._decode) {
      this._decode = (await import("base64-arraybuffer")).decode;
    }
    const ab = this._decode(src);
    return ab;
  }
}

export default new BASE64_ArrayBuffer();
