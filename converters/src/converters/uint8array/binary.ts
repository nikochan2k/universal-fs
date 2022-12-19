import { AbstractConverter } from "../../UnivConv";

class Uint8Array_Binary extends AbstractConverter<ArrayBuffer, string> {
  protected _convert(src: Uint8Array): Promise<string> {
    return Promise.resolve(
      typeof Buffer === "function"
        ? Buffer.from(src).toString("binary")
        : Array.from(src, (e) => String.fromCharCode(e)).join("")
    );
  }
}

export default new Uint8Array_Binary();
