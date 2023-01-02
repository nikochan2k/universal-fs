import { AbstractConverter } from "../../UnivConv";
import { newBuffer } from "../../util";

class ArrayBuffer_Uint8Array extends AbstractConverter<
  ArrayBuffer,
  Uint8Array
> {
  public _convert(src: ArrayBuffer): Promise<Uint8Array> {
    return Promise.resolve(newBuffer(src));
  }
}

export default new ArrayBuffer_Uint8Array();
