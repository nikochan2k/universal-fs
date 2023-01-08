import { ArrayBufferLikeManipulator } from "../supports/manipulators/ArrayBufferLikeManipulator.js";

export const EMPTY_ARRAY_BUFFER = new ArrayBuffer(0);

class ArrayBufferManipulator extends ArrayBufferLikeManipulator<ArrayBuffer> {
  public name = ArrayBuffer.name;

  public empty(): Promise<ArrayBuffer> {
    return Promise.resolve(EMPTY_ARRAY_BUFFER);
  }

  protected _validateSource(src: unknown): src is ArrayBuffer {
    return src instanceof ArrayBuffer;
  }

  protected newArrayBufferLike(byteLength: number): ArrayBuffer {
    return new ArrayBuffer(byteLength);
  }
}

export default new ArrayBufferManipulator();
