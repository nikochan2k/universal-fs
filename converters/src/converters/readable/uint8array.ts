import type { Readable } from "stream";
import { handleReadable } from "../../supports/NodeStream";
import { AbstractConverter } from "../../UnivConv";

class Readable_Uint8Array extends AbstractConverter<Readable, Uint8Array> {
  public async _convert(src: Readable): Promise<Uint8Array> {
    const chunks: Buffer[] = [];
    await handleReadable(src, (chunk) => chunks.push(chunk));
    return Buffer.concat(chunks);
  }
}

export default new Readable_Uint8Array();
