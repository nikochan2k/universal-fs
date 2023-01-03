import { AbstractConverter } from "../../UnivConv";
import type b2u from "./uint8array";

class Binary_ArrayBuffer extends AbstractConverter<string, ArrayBuffer> {
  private b2u?: typeof b2u;

  public async _convert(src: string): Promise<ArrayBuffer> {
    if (!this.b2u) {
      this.b2u = (await import("./uint8array")).default;
    }

    const u8 = await this.b2u._convert(src);
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  }
}

export default new Binary_ArrayBuffer();
