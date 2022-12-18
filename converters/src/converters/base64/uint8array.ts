import UNIV_CONV, { AbstractConverter } from "../../UnivConv";

class BASE64_Uint8Array extends AbstractConverter<string, Uint8Array> {
  protected async _convert(src: string): Promise<Uint8Array> {
    const ab = await UNIV_CONV.convert(src, ArrayBuffer, { srcType: "base64" });
    return new Uint8Array(ab);
  }
}

export default new BASE64_Uint8Array();
