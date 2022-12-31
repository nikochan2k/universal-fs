import { AbstractConverter } from "../../UnivConv";
import b2u from "./uint8array";

class BASE64_Blob extends AbstractConverter<string, Blob> {
  public async _convert(src: string): Promise<Blob> {
    const u8 = await b2u._convert(src);
    return new Blob([u8]);
  }
}

export default new BASE64_Blob();
