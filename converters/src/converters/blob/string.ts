import { Converter, ConvertOptions } from "../../core.js";
import { handleFileReader, hasTextOnBlob } from "../../supports/Blob.js";
import UNIV_CONV from "../../UnivConv.js";
import { DEFAULT_BUFFER_SIZE } from "../../util.js";
import type b2u from "./uint8array.js";

class Blob_String implements Converter<Blob, string> {
  private b2u?: typeof b2u;

  async convert(
    src: Blob,
    options?: ConvertOptions | undefined
  ): Promise<string> {
    const srcTextEncoding = options?.srcTextEncoding ?? "utf8";
    if (srcTextEncoding === "utf8") {
      if (hasTextOnBlob) {
        return await src.text();
      }
      return await handleFileReader(
        (reader) => reader.readAsText(src),
        (data) => data as string
      );
    }

    if (!this.b2u) {
      this.b2u = (await import("./uint8array.js")).default;
    }
    const u8 = await this.b2u._convert(
      src,
      options?.bufferSize ?? DEFAULT_BUFFER_SIZE
    );
    return await UNIV_CONV.convert(u8, "string", options);
  }
}

export default new Blob_String();
