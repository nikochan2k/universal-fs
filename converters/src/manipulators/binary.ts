import { SliceOptions } from "../core.js";
import { StringManipulator } from "../supports/manipulators/StringManipulator.js";

export const EMPTY_BINARY = "";

class BinaryManipulator extends StringManipulator {
  public name = "Binary";

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
}

export default new BinaryManipulator();
