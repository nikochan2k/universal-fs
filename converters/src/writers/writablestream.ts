import { ConvertOptions, Variant, Writer } from "../core.js";
import { pipeWebStream } from "../supports/WebStream.js";
import UNIV_CONV from "../UnivConv.js";

class WritableStreamWriter implements Writer<WritableStream<Uint8Array>> {
  async write(
    src: Variant,
    dst: WritableStream<Uint8Array>,
    options?: ConvertOptions | undefined
  ): Promise<void> {
    const rs: ReadableStream<Uint8Array> = await UNIV_CONV.convert(
      src,
      "readablestream",
      options
    );
    await pipeWebStream(rs, dst);
  }
}

export default new WritableStreamWriter();
