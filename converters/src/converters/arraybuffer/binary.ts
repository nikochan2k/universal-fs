import { AbstractConverter } from "../../UnivConv";
import { hasBuffer, newBuffer } from "../../util";

class ArrayBuffer_Binary extends AbstractConverter<ArrayBuffer, string> {
  public _convert(src: ArrayBuffer): Promise<string> {
    if (hasBuffer) {
      return Promise.resolve(Buffer.from(src).toString("binary"));
    }
    const buffer = newBuffer(src);
    return Promise.resolve(
      Array.from(buffer, (e) => String.fromCharCode(e)).join("")
    );
  }
}

export default new ArrayBuffer_Binary();
