import { AbstractConverter } from "../../UnivConv";

class Uint8Array_ArrayBuffer extends AbstractConverter<
  Uint8Array,
  ArrayBuffer
> {
  public _convert(src: Uint8Array): Promise<ArrayBuffer> {
    return Promise.resolve(
      src.buffer.slice(src.byteOffset, src.byteOffset + src.byteLength)
    );
  }
}

export default new Uint8Array_ArrayBuffer();
