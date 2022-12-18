import { encode } from "base64-arraybuffer";
import { AbstractConverter } from "../../UnivConv";

class ArrayBuffer_BASE64 extends AbstractConverter<ArrayBuffer, string> {
  protected _convert(src: ArrayBuffer): Promise<string> {
    const base64 = encode(src);
    return Promise.resolve(base64);
  }
}

export default new ArrayBuffer_BASE64();
