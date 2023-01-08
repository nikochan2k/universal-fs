import { hasBuffer, newBuffer } from "../../supports/Environment.js";
import { AbstractConverter } from "../../UnivConv.js";

class Uint8Array_Binary extends AbstractConverter<ArrayBuffer, string> {
  public _convert(src: Uint8Array): Promise<string> {
    return Promise.resolve(
      hasBuffer
        ? newBuffer(src).toString("binary")
        : Array.from(src, (e) => String.fromCharCode(e)).join("")
    );
  }
}

export default new Uint8Array_Binary();
