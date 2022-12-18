import { decode } from "base64-arraybuffer";
import { AbstractConverter } from "../../UnivConv";

class BASE64_ArrayBuffer extends AbstractConverter<string, ArrayBuffer> {
  protected _convert(src: string): Promise<ArrayBuffer> {
    const ab = decode(src);
    return Promise.resolve(ab);
  }
}

export default new BASE64_ArrayBuffer();
