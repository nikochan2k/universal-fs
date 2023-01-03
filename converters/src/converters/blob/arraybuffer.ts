import { AbstractConverter } from "../../UnivConv.js";
import type b2u from "./uint8array.js";

class Blob_ArrayBuffer extends AbstractConverter<Blob, ArrayBuffer> {
  private b2u?: typeof b2u;

  public async _convert(src: Blob, bufferSize?: number): Promise<ArrayBuffer> {
    if (!this.b2u) {
      this.b2u = (await import("./uint8array.js")).default;
    }
    const u8 = await this.b2u._convert(src, bufferSize);
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  }
}

export default new Blob_ArrayBuffer();
