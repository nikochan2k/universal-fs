import { Readable } from "stream";
import { AbstractConverter } from "../../UnivConv";
import r2u from "./uint8array";

class Readable_BASE64 extends AbstractConverter<Readable, string> {
  public async _convert(src: Readable): Promise<string> {
    const buffer = (await r2u._convert(src)) as Buffer;
    return buffer.toString("base64");
  }
}

export default new Readable_BASE64();
