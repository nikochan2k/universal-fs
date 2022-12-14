import { AbstractConverter } from "../../UnivConv.js";

class ArrayBuffer_Blob extends AbstractConverter<ArrayBuffer, Blob> {
  public _convert(src: ArrayBuffer): Promise<Blob> {
    return Promise.resolve(new Blob([src]));
  }
}

export default new ArrayBuffer_Blob();
