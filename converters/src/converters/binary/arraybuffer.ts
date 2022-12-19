import { AbstractConverter } from "../../UnivConv";
import b2u from "./uint8array";

class Binary_ArrayBuffer extends AbstractConverter<string, ArrayBuffer> {
  protected async _convert(src: string): Promise<ArrayBuffer> {
    const u8 = await b2u.convert(src);
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  }
}

export default new Binary_ArrayBuffer();
