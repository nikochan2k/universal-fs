import { ReadableConverter } from "../../supports/converters/readable/ReadableConverter";

class Readable_Uint8Array extends ReadableConverter<Uint8Array> {
  protected _convertBuffer(buffer: Buffer): Uint8Array {
    return buffer;
  }
}

export default new Readable_Uint8Array();
