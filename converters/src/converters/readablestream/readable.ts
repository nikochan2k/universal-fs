import { Readable } from "stream";
import { AbstractConverter } from "../../UnivConv.js";

class ReadableOfReadableStream extends Readable {
  constructor(private stream: ReadableStream<Uint8Array>) {
    super();
    this.setup(); // eslint-disable-line @typescript-eslint/no-floating-promises
  }

  private async setup() {
    const reader = this.stream.getReader();
    try {
      let res = await reader.read();
      while (!res.done) {
        this.push(res.value);
        res = await reader.read();
      }
      this.push(null);
    } catch (e) {
      this.destroy(e as Error);
    } finally {
      reader.releaseLock();
      this.stream.cancel().catch((e) => console.debug(e));
    }
  }
}

class ReadableStream_Readable extends AbstractConverter<
  ReadableStream<Uint8Array>,
  Readable
> {
  public _convert(src: ReadableStream<Uint8Array>): Promise<Readable> {
    return Promise.resolve(new ReadableOfReadableStream(src));
  }
}

export default new ReadableStream_Readable();
