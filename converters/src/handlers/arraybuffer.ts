import { AbstractHandler, Options } from "../core";

export class ArrayBufferHandler extends AbstractHandler<ArrayBuffer> {
  private static EMPTY = new ArrayBuffer(0);

  public empty(): Promise<ArrayBuffer> {
    return Promise.resolve(ArrayBufferHandler.EMPTY);
  }

  protected _isEmpty(src: ArrayBuffer): Promise<boolean> {
    return Promise.resolve(src.byteLength === 0);
  }

  protected _merge(src: ArrayBuffer[]): Promise<ArrayBuffer> {
    const byteLength = src.reduce((sum, chunk) => {
      return sum + chunk.byteLength;
    }, 0);
    const u8 = new Uint8Array(byteLength);
    let pos = 0;
    for (const chunk of src) {
      u8.set(new Uint8Array(chunk), pos);
      pos += chunk.byteLength;
    }
    return Promise.resolve(u8.buffer);
  }

  protected _pipe(
    src: ArrayBuffer,
    dst: NodeJS.WritableStream | WritableStream<unknown>,
    bufferSize?: number | undefined
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  protected _size(src: ArrayBuffer): Promise<number> {
    return Promise.resolve(src.byteLength);
  }

  protected _slice(src: ArrayBuffer, options?: Options): Promise<ArrayBuffer> {
    const start = options?.start ?? 0;
    const end = options?.length == null ? undefined : start + options.length;
    const sliced = src.slice(start, end);
    return Promise.resolve(sliced);
  }
}
