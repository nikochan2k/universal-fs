import { AbstractConverter } from "../../UnivConv";
import {
  dataUrlToBase64,
  DEFAULT_BUFFER_SIZE,
  handleFileReader,
} from "../../util";

class Blob_BASE64 extends AbstractConverter<Blob, string> {
  public async _convert(src: Blob, bufferSize?: number): Promise<string> {
    const length = src.size;
    if (!bufferSize) bufferSize = DEFAULT_BUFFER_SIZE;

    const chunks: string[] = [];
    for (let start = 0; start < length; start += bufferSize) {
      let end = start + bufferSize;
      if (length < end) end = length;
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