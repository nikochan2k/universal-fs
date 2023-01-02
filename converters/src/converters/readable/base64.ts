import { ReadableConverter } from "./ReadableConverter";

class Readable_BASE64 extends ReadableConverter<string> {
  protected _convertBuffer(buffer: Buffer): string {
    return buffer.toString("base64");
  }
}

export default new Readable_BASE64();
