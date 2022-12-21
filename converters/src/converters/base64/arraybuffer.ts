import type { decode } from "base64-arraybuffer";
import { AbstractConverter } from "../../UnivConv";
import { hasBuffer } from "../../util";

class BASE64_ArrayBuffer extends AbstractConverter<string, ArrayBufferLike> {
  private _decode?: typeof decode;

  public async _convert(src: string): Promise<ArrayBufferLike> {
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
