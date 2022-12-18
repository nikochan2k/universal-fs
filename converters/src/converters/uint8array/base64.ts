import { encode } from "base64-arraybuffer";
import UNIV_CONV, { AbstractConverter } from "../../UnivConv";

class Uint8Array_BASE64 extends AbstractConverter<Uint8Array, string> {
  protected async _convert(src: Uint8Array): Promise<string> {
    const ab = await UNIV_CONV.convert(src, ArrayBuffer);
    const base64 = encode(ab);
    return Promise.resolve(base64);
  }
}

export default new Uint8Array_BASE64();
