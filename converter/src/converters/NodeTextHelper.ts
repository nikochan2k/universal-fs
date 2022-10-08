import { bufferConverter } from "./converters";
import { Charset } from "./core";
import { TextHelper } from "./TextHelper";

class NodeTextHelper extends TextHelper {
  public override async bufferToText(
    buf: Uint8Array,
    bufCharset: Charset
  ): Promise<string> {
    let buffer: Buffer;
    if (bufferConverter().typeEquals(buf)) {
      buffer = buf;
    } else {
      buffer = await bufferConverter().convert(buf);
    }
    if (bufCharset === "utf8" || bufCharset === "utf16le") {
      return buffer.toString(bufCharset as BufferEncoding);
    }
    return await super.bufferToText(buf, bufCharset);
  }

  public override async textToBuffer(
    text: string,
    bufCharset: Charset
  ): Promise<Uint8Array> {
    if (bufCharset === "utf8" || bufCharset === "utf16le") {
      return Buffer.from(text, bufCharset as BufferEncoding);
    }
    return await super.textToBuffer(text, bufCharset);
  }
}

export const NODE_TEXT_HELPER = new NodeTextHelper();
