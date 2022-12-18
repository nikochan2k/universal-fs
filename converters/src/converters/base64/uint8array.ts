import { decode } from "base64-arraybuffer";
import { AbstractConverter } from "../../UnivConv";

class BASE64_Uint8Array extends AbstractConverter<string, Uint8Array> {
  protected _convert(src: string): Promise<Uint8Array> {
    const ab = decode(src);
    return Promise.resolve(new Uint8Array(ab));
  }
}

export default new BASE64_Uint8Array();
