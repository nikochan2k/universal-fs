import { AbstractConverter } from "../../UnivConv";
import a2b from "../arraybuffer/base64";

class Uint8Array_BASE64 extends AbstractConverter<Uint8Array, string> {
  protected async _convert(src: Uint8Array): Promise<string> {
    const ab = src.buffer.slice(
      src.byteOffset,
      src.byteOffset + src.byteLength
    );
    const base64 = await a2b.convert(ab);
    return base64;
  }
}

export default new Uint8Array_BASE64();
