import { encode } from "base64-arraybuffer";
import { AbstractConverter } from "../../UnivConv";

class Uint8Array_BASE64 extends AbstractConverter<Uint8Array, string> {
  protected _convert(src: Uint8Array): Promise<string> {
    const ab = src.buffer.slice(
      src.byteOffset,
      src.byteOffset + src.byteLength
    );
    const base64 = encode(ab);
    return Promise.resolve(base64);
  }
}

export default new Uint8Array_BASE64();
