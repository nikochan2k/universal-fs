import { ReadableConverter } from "./ReadableConverter";

class Readable_ArrayBuffer extends ReadableConverter<ArrayBuffer> {
  protected _convertBuffer(buf: Buffer): ArrayBuffer {
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
}

export default new Readable_ArrayBuffer();