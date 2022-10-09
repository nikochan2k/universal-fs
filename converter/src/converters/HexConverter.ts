import { DEFAULT_CONVERTER } from "../converver";
import {
  AbstractConverter,
  ConvertOptions,
  Data,
  DataType,
  deleteStartLength,
  getStartEnd,
  hasNoStartLength,
} from "./core";
import { getTextHelper, isNode } from "./util";

const BYTE_TO_HEX: string[] = [];
for (let n = 0; n <= 0xff; ++n) {
  const hexOctet = n.toString(16).padStart(2, "0");
  BYTE_TO_HEX.push(hexOctet);
}

const HEX_STRINGS = "0123456789abcdef";
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

export class HexConverter extends AbstractConverter<string> {
  public type: DataType = "hex";

  public empty(): string {
    return "";
  }

  public match(input: unknown, options: ConvertOptions): input is string {
    return typeof input === "string" && options.srcStringType === "hex";
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<string | undefined> {
    if (typeof input === "string" && options.srcStringType === "hex") {
      if (hasNoStartLength(options)) {
        return input;
      }
      const { start, end } = await this._getStartEnd(input, options);
      return input.slice(start * 2, end ? end * 2 : undefined);
    }

    const u8 = await DEFAULT_CONVERTER.of("uint8array").convert(input, options);
    return (
      Array.from(u8)
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        .map((b) => (HEX_STRINGS[b >> 4] as string) + HEX_STRINGS[b & 15])
        .join("")
    );
  }

  protected _getSize(input: string): Promise<number> {
    return Promise.resolve(input.length / 2);
  }

  protected _getStartEnd(
    input: string,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    return Promise.resolve(getStartEnd(options, input.length / 2));
  }

  protected _isEmpty(input: string): boolean {
    return !input;
  }

  protected async _merge(chunks: string[]): Promise<string> {
    return Promise.resolve(chunks.join(""));
  }

  protected async _toArrayBuffer(
    input: string,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const u8 = await this.toUint8Array(input, options);
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  }

  protected async _toBase64(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    return await DEFAULT_CONVERTER.of("base64").convert(
      u8,
      deleteStartLength(options)
    );
  }

  protected async _toText(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    const textHelper = await getTextHelper();
    return await textHelper.bufferToText(u8, options);
  }

  protected async _toUint8Array(
    input: string,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const startEnd = await this._getStartEnd(input, options);
    let start = startEnd.start;
    const end = startEnd.end as number;

    const u8 = isNode ? Buffer.alloc(end - start) : new Uint8Array(end - start);
    for (; start < end; start++) {
      const ai = input[start * 2] as string;
      const a = MAP_HEX[ai];
      const bi = input[start * 2 + 1] as string;
      const b = MAP_HEX[bi];
      if (a == null || b == null) {
        break;
      }
      u8[start] = (a << 4) | b;
    }
    return u8;
  }
}

export const INSTANCE = new HexConverter();
