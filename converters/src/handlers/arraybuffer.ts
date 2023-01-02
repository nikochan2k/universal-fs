import { ArrayBufferLikeHandler } from "./arraybufferlike";

export const EMPTY_ARRAY_BUFFER = new ArrayBuffer(0);

class ArrayBufferHandler extends ArrayBufferLikeHandler<ArrayBuffer> {
  public name = ArrayBuffer.name;

  public empty(): Promise<ArrayBuffer> {
    return Promise.resolve(EMPTY_ARRAY_BUFFER);
  }

  protected _validateSource(src: ArrayBuffer): boolean {
    return src instanceof ArrayBuffer;
  }

  protected newArrayBufferLike(byteLength: number): ArrayBuffer {
    return new ArrayBuffer(byteLength);
  }
}

export default new ArrayBufferHandler();
