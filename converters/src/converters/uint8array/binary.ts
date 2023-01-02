import { AbstractConverter } from "../../UnivConv";
import { hasBuffer, newBuffer } from "../../util";

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
