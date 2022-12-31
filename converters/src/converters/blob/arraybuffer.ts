import { AbstractConverter } from "../../UnivConv";
import b2u from "./uint8array";

class Blob_ArrayBuffer extends AbstractConverter<Blob, ArrayBufferLike> {
  public async _convert(
    src: Blob,
    bufferSize?: number
  ): Promise<ArrayBufferLike> {
    const u8 = await b2u._convert(src, bufferSize);
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  }
}

export default new Blob_ArrayBuffer();
