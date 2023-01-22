import UNIV_CONV, { AbstractConverter } from "../../UnivConv.js";

class Uint8Array_BASE64 extends AbstractConverter<Uint8Array, string> {
  public async _convert(src: Uint8Array): Promise<string> {
    const ab = src.buffer.slice(
      src.byteOffset,
      src.byteOffset + src.byteLength
    );
    return await UNIV_CONV.convert(ab, "base64");
  }
}

export default new Uint8Array_BASE64();
