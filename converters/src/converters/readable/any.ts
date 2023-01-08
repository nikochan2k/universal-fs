import { Readable } from "stream";
import { Converter, ConvertOptions } from "../../core.js";
import { handleReadable } from "../../supports/NodeStream.js";
import UNIV_CONV from "../../UnivConv.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
class Readable_Any implements Converter<Readable, any> {
  async convert(src: Readable, options: ConvertOptions): Promise<any> {
    const buffers: Buffer[] = [];
    await handleReadable(src, (chunk) => {
      buffers.push(chunk);
    });
    const buffer = Buffer.concat(buffers);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return await UNIV_CONV.convert(buffer, options.dstType!);
  }
}

export default new Readable_Any();
