import { AbstractConverter } from "../../UnivConv";

class Binary_Uint8Array extends AbstractConverter<string, Uint8Array> {
  protected _convert(src: string): Promise<Uint8Array> {
    const u8 =
      typeof Buffer === "function"
        ? Buffer.from(src, "binary")
        : Uint8Array.from(src.split(""), (e) => e.charCodeAt(0));
    return Promise.resolve(u8);
  }
}

export default new Binary_Uint8Array();
