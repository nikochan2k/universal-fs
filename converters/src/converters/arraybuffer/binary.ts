import { AbstractConverter } from "../../UnivConv";

class ArrayBuffer_Binary extends AbstractConverter<ArrayBuffer, string> {
  protected _convert(src: ArrayBuffer): Promise<string> {
    if (typeof Buffer === "function") {
      return Promise.resolve(Buffer.from(src).toString("binary"));
    }
    const u8 = new Uint8Array(src);
    return Promise.resolve(
      Array.from(u8, (e) => String.fromCharCode(e)).join("")
    );
  }
}

export default new ArrayBuffer_Binary();
