import { hasBuffer, newBuffer } from "../../supports/Environment.js";
import { AbstractConverter } from "../../UnivConv.js";

const BYTE_TO_HEX: string[] = [];
for (let n = 0; n <= 0xff; ++n) {
  const hexOctet = n.toString(16).padStart(2, "0");
  BYTE_TO_HEX.push(hexOctet);
}

const MAP_HEX: { [key: string]: number } = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  a: 10,
  A: 10,
  b: 11,
  B: 11,
  c: 12,
  C: 12,
  d: 13,
  D: 13,
  e: 14,
  E: 14,
  f: 15,
  F: 15,
};

class Hex_Uint8Array extends AbstractConverter<string, Uint8Array> {
  _convert(src: string): Promise<Uint8Array> {
    if (hasBuffer) {
      return Promise.resolve(Buffer.from(src, "hex"));
    }
    const size = src.length;
    const u8 = newBuffer(size);
    for (let i = 0; i < size; i++) {
      const ai = src[i * 2] as string;
      const a = MAP_HEX[ai];
      const bi = src[i * 2 + 1] as string;
      const b = MAP_HEX[bi];
      if (a == null || b == null) {
        break;
      }
      u8[i] = (a << 4) | b;
    }
    return Promise.resolve(u8);
  }
}

export default new Hex_Uint8Array();
