import UNIV_CONV, { AbstractConverter } from "../../UnivConv";

class Uint8Array_BASE64 extends AbstractConverter<Uint8Array, string> {
  protected async _convert(src: Uint8Array): Promise<string> {
    const ab = src.buffer.slice(
      src.byteOffset,
      src.byteOffset + src.byteLength
    );
    const base64: string = await UNIV_CONV.convert(ab, "base64");
    return base64;
  }
}

export default new Uint8Array_BASE64();
