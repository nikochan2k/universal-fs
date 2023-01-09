import { Converter, ConvertOptions } from "../../core.js";
import { handleFileReader, hasTextOnBlob } from "../../supports/Blob.js";
import { DEFAULT_BUFFER_SIZE } from "../../util.js";
import u2s from "../uint8array/string.js";
import b2u from "./uint8array.js";

class Blob_String implements Converter<Blob, string> {
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

    const u8 = await b2u._convert(
      src,
      options?.bufferSize ?? DEFAULT_BUFFER_SIZE
    );
    return await u2s.convert(u8, options);
  }
}

export default new Blob_String();
