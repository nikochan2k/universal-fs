import { _ } from "./AbstractConverter";
import { ConvertOptions } from "./core";
import { isBuffer } from "./NodeUtil";
import { TextHelper } from "./TextHelper";

export class NodeTextHelper extends TextHelper {
  public override async bufferToText(
    buf: Uint8Array,
    options: ConvertOptions
  ): Promise<string> {
    let buffer: Buffer;
    if (isBuffer(buf)) {
      buffer = buf;
    } else {
      buffer = (await _().convert("uint8array", buf)) as Buffer;
    }
    const bufCharset = options.bufferToTextCharset;
    if (bufCharset === "utf8" || bufCharset === "utf16le") {
      return buffer.toString(bufCharset as BufferEncoding);
    }
    return await super.bufferToText(buf, options);
  }

  public override async textToBuffer(
    text: string,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const bufCharset = options.textToBufferCharset;
    if (bufCharset === "utf8" || bufCharset === "utf16le") {
      return Buffer.from(text, bufCharset as BufferEncoding);
    }
    return await super.textToBuffer(text, options);
  }
}
