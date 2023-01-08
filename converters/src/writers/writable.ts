import type { Readable, Writable } from "stream";
import { ConvertOptions, Variant, Writer } from "../core.js";
import { pipeNodeStream } from "../supports/NodeStream.js";
import UNIV_CONV from "../UnivConv.js";

class WritableWriter implements Writer<Writable> {
  async write(
    src: Variant,
    dst: Writable,
    options?: ConvertOptions | undefined
  ): Promise<void> {
    const readable: Readable = await UNIV_CONV.convert(
      src,
      "readable",
      options
    );
    await pipeNodeStream(readable, dst);
  }
}

export default new WritableWriter();
