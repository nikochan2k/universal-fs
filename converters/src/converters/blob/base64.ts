import { handleFileReader } from "../../supports/Blob.js";
import { AbstractConverter } from "../../UnivConv.js";
import { dataUrlToBase64, DEFAULT_BUFFER_SIZE } from "../../util.js";

class Blob_BASE64 extends AbstractConverter<Blob, string> {
  public async _convert(src: Blob, bufferSize?: number): Promise<string> {
    const size = src.size;
    if (!bufferSize) bufferSize = DEFAULT_BUFFER_SIZE;
    const mod = bufferSize % 3;
    if (mod !== 0) {
      bufferSize -= mod;
    }

    const chunks: string[] = [];
    for (let start = 0; start < size; start += bufferSize) {
      let end = start + bufferSize;
      if (size < end) end = size;
      const blob = src.slice(start, end);
      const base64 = await handleFileReader(
        (reader) => reader.readAsDataURL(blob),
        (data) => dataUrlToBase64(data as string)
      );
      chunks.push(base64);
    }
    return chunks.join("");
  }
}

export default new Blob_BASE64();
