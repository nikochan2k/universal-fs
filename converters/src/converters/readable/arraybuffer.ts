import type { Readable } from "stream";
import { handleReadable } from "../../supports/NodeStream";
import { AbstractConverter } from "../../UnivConv";

class Readable_ArrayBuffer extends AbstractConverter<Readable, ArrayBuffer> {
  public async _convert(src: Readable): Promise<ArrayBuffer> {
    const chunks: Buffer[] = [];
    await handleReadable(src, (chunk) => {
      chunks.push(chunk);
      return Promise.resolve();
    });
    const buf = Buffer.concat(chunks);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
}

export default new Readable_ArrayBuffer();
