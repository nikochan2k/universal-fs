import type { decode } from "base64-arraybuffer";
import { AbstractConverter } from "../../UnivConv";

class BASE64_Uint8Array extends AbstractConverter<string, Uint8Array> {
  private _decode?: typeof decode;

  protected async _convert(src: string): Promise<Uint8Array> {
    if (!this._decode) {
      this._decode = (await import("base64-arraybuffer")).decode;
    }
    const ab = this._decode(src);
    return new Uint8Array(ab);
  }
}

export default new BASE64_Uint8Array();
