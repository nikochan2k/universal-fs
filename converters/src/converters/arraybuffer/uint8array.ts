import { AbstractConverter } from "../../UnivConv";

class ArrayBuffer_Uint8Array extends AbstractConverter<
  ArrayBuffer,
  Uint8Array
> {
  protected _convert(src: ArrayBuffer): Promise<Uint8Array> {
    return Promise.resolve(new Uint8Array(src));
  }
}

export default new ArrayBuffer_Uint8Array();
