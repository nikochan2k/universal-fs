import { AbstractConverter } from "../../UnivConv";
import b2a from "./arraybuffer";

class BASE64_Uint8Array extends AbstractConverter<string, Uint8Array> {
  protected async _convert(src: string): Promise<Uint8Array> {
    const ab = await b2a.convert(src);
    return new Uint8Array(ab);
  }
}

export default new BASE64_Uint8Array();
