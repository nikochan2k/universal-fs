import { AbstractConverter } from "../../UnivConv";
import { newBuffer } from "../../util";

class ArrayBuffer_Uint8Array extends AbstractConverter<
  ArrayBufferLike,
  Uint8Array
> {
  protected _convert(src: ArrayBufferLike): Promise<Uint8Array> {
    return Promise.resolve(newBuffer(src));
  }
}

export default new ArrayBuffer_Uint8Array();
