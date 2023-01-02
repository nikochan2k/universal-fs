import { AbstractHandler, SliceOptions } from "../core";

export const EMPTY_BINARY = "";

class BinaryHandler extends AbstractHandler<string> {
  public name = "Binary";

  public empty(): Promise<string> {
    return Promise.resolve(EMPTY_BINARY);
  }

  protected _isEmpty(src: string): Promise<boolean> {
    return Promise.resolve(src.length === 0);
  }

  protected async _merge(src: string[]): Promise<string> {
    return Promise.resolve(src.join(""));
  }

  protected _size(src: string): Promise<number> {
    return Promise.resolve(src.length);
  }

  protected _slice(src: string, options?: SliceOptions): Promise<string> {
    const start = options?.start ?? 0;
    let end: number | undefined;
    if (options?.length != null) {
      end = start + options.length;
      if (src.length < end) {
        end = src.length;
      }
    }
    return Promise.resolve(src.slice(start, end));
  }

  protected _validateSource(src: string): boolean {
    return typeof src === "string";
  }
}

export default new BinaryHandler();
