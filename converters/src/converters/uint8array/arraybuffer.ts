import { AbstractConverter } from "../../UnivConv";

class Uint8Array_ArrayBuffer extends AbstractConverter<
  Uint8Array,
  ArrayBufferLike
> {
  public _convert(src: Uint8Array): Promise<ArrayBufferLike> {
    return Promise.resolve(
      src.buffer.slice(src.byteOffset, src.byteOffset + src.byteLength)
    );
  }
}

export default new Uint8Array_ArrayBuffer();
