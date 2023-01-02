import type { Readable } from "stream";
import { handleReadable } from "../../supports/NodeStream";
import { AbstractConverter } from "../../UnivConv";

class Readable_Uint8Array extends AbstractConverter<Readable, Uint8Array> {
  public async _convert(src: Readable): Promise<Uint8Array> {
    const chunks: Uint8Array[] = [];
    await handleReadable(src, (chunk) => {
      chunks.push(chunk);
      return Promise.resolve();
    });
    return Buffer.concat(chunks);
  }
}

export default new Readable_Uint8Array();
