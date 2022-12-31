import { AbstractConverter } from "../../UnivConv";

class Uint8Array_Blob extends AbstractConverter<Uint8Array, Blob> {
  public _convert(src: Uint8Array): Promise<Blob> {
    return Promise.resolve(new Blob([src]));
  }
}

export default new Uint8Array_Blob();
