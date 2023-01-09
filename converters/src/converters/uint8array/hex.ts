import { hasBuffer } from "../../supports/Environment.js";
import { AbstractConverter } from "../../UnivConv.js";

const HEX_STRINGS = "0123456789abcdef";

class Uint8Array_Hex extends AbstractConverter<Uint8Array, string> {
  _convert(src: Uint8Array): Promise<string> {
    if (hasBuffer && src instanceof Buffer) {
      return Promise.resolve(src.toString("hex"));
    }
    return Promise.resolve(
      Array.from(src)
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        .map((b) => (HEX_STRINGS[b >> 4] as string) + HEX_STRINGS[b & 15])
        .join("")
    );
  }
}

export default new Uint8Array_Hex();
