import {
  handleFileReader,
  hasReadAsBinaryStringOnBlob,
} from "../../supports/Blob.js";
import UNIV_CONV, { AbstractConverter } from "../../UnivConv.js";
import { DEFAULT_BUFFER_SIZE } from "../../util.js";
import type b2u from "./uint8array.js";

class Blob_Binary extends AbstractConverter<Blob, string> {
  private b2u?: typeof b2u;

  public async _convert(src: Blob, bufferSize: number): Promise<string> {
    if (hasReadAsBinaryStringOnBlob) {
      const size = src.size;
      bufferSize = bufferSize ?? DEFAULT_BUFFER_SIZE;
      const chunks: string[] = [];
      for (let start = 0; start < size; start += bufferSize) {
        let end = start + bufferSize;
        if (end < size) end = size;
        const blob = src.slice(start, end);
        const binary = await handleFileReader(
          (reader) => reader.readAsBinaryString(blob),
          (data) => data as string
        );
        chunks.push(binary);
      }
      return chunks.join("");
    }

    if (!this.b2u) {
      this.b2u = (await import("./uint8array.js")).default;
    }
    const u8 = await this.b2u._convert(src, bufferSize);
    return await UNIV_CONV.convert(u8, "binary");
  }
}

export default new Blob_Binary();
