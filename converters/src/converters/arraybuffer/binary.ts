import { AbstractConverter } from "../../UnivConv";
import { hasBuffer, newBuffer } from "../../util";

class ArrayBuffer_Binary extends AbstractConverter<ArrayBufferLike, string> {
  public _convert(src: ArrayBufferLike): Promise<string> {
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