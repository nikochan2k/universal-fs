import { Readable } from "stream";

export class ReadableOfReadableStream extends Readable {
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
