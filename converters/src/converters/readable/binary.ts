import { ReadableConverter } from "./ReadableConverter";

class Readable_Binary extends ReadableConverter<string> {
  protected _convertBuffer(buffer: Buffer): string {
    return buffer.toString("binary");
  }
}

export default new Readable_Binary();
