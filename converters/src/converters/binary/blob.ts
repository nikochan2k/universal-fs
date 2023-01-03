import { AbstractConverter } from "../../UnivConv";
import type b2u from "./uint8array";

class Binary_Blob extends AbstractConverter<string, Blob> {
  private b2u?: typeof b2u;

  public async _convert(src: string): Promise<Blob> {
    if (!this.b2u) {
      this.b2u = (await import("./uint8array")).default;
    }
    const u8 = await this.b2u._convert(src);
    return new Blob([u8]);
  }
}

export default new Binary_Blob();
