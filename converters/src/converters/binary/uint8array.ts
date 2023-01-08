import { hasBuffer } from "../../supports/Environment.js";
import { AbstractConverter } from "../../UnivConv.js";

class Binary_Uint8Array extends AbstractConverter<string, Uint8Array> {
  public _convert(src: string): Promise<Uint8Array> {
    const buffer = hasBuffer
      ? Buffer.from(src, "binary")
      : Uint8Array.from(src.split(""), (e) => e.charCodeAt(0));
    return Promise.resolve(buffer);
  }
}

export default new Binary_Uint8Array();
