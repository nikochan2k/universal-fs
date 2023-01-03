import type u2b from "../../converters/uint8array/binary";
import {
  handleFileReader,
  hasReadAsBinaryStringOnBlob,
} from "../../supports/Blob";
import { AbstractConverter } from "../../UnivConv";
import { DEFAULT_BUFFER_SIZE } from "../../util";
import type b2u from "./uint8array";

class Blob_Binary extends AbstractConverter<Blob, string> {
  private u2b?: typeof u2b;
  private b2u?: typeof b2u;

  public async _convert(src: Blob, bufferSize?: number): Promise<string> {
    if (hasReadAsBinaryStringOnBlob) {
      const length = src.length;
      bufferSize = bufferSize ?? DEFAULT_BUFFER_SIZE;
      const chunks: string[] = [];
      for (let start = 0; start < length; start += bufferSize) {
        let end = start + bufferSize;
        if (end < length) end = length;
        const blob = src.slice(start, end);
        const binary = await handleFileReader(
          (reader) => reader.readAsBinaryString(blob),
          (data) => data as string
        );
        chunks.push(binary);
      }
      return chunks.join("");
    }

    if (!this.u2b) {
      this.u2b = (await import("../../converters/uint8array/binary")).default;
    }
    if (!this.b2u) {
      this.b2u = (await import("./uint8array")).default;
    }
    const u8 = await this.b2u._convert(src);
    const binary = await this.u2b._convert(u8);
    return binary;
  }
}

export default new Blob_Binary();
