import { AbstractHandler, SliceOptions } from "../core";

export const EMPTY_BLOB = new Blob([]);

class BlobHandler extends AbstractHandler<Blob> {
  public name = Blob.name;

  public empty(): Promise<Blob> {
    return Promise.resolve(EMPTY_BLOB);
  }

  protected _isEmpty(src: Blob): Promise<boolean> {
    return Promise.resolve(src.size === 0);
  }

  protected _merge(src: Blob[]): Promise<Blob> {
    return Promise.resolve(new Blob(src));
  }

  protected _size(src: Blob): Promise<number> {
    return Promise.resolve(src.size);
  }

  protected _slice(src: Blob, options?: SliceOptions): Promise<Blob> {
    const start = options?.start ?? 0;
    let end: number | undefined;
    if (options?.length != null) {
      end = start + options.length;
      if (src.size < end) end = src.size;
    }
    const sliced = src.slice(start, end);
    return Promise.resolve(sliced);
  }

  protected _validateSource(src: unknown): src is Blob {
    return src instanceof Blob;
  }
}

export default new BlobHandler();
