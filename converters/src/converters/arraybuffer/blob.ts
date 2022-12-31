import { AbstractConverter } from "../../UnivConv";

class ArrayBuffer_Blob extends AbstractConverter<ArrayBufferLike, Blob> {
  public _convert(src: ArrayBufferLike): Promise<Blob> {
    return Promise.resolve(new Blob([src]));
  }
}

export default new ArrayBuffer_Blob();
