import { AbstractConverter } from "../../UnivConv";
import { hasBuffer } from "../../util";

class Binary_Uint8Array extends AbstractConverter<string, Uint8Array> {
  protected _convert(src: string): Promise<Uint8Array> {
    const buffer = hasBuffer
      ? Buffer.from(src, "binary")
      : Uint8Array.from(src.split(""), (e) => e.charCodeAt(0));
    return Promise.resolve(buffer);
  }
}

export default new Binary_Uint8Array();
