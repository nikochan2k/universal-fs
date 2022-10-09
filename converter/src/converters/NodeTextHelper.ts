import { $ } from "./AbstractConverter";
import { ConvertOptions } from "./core";
import { TextHelper } from "./TextHelper";

export class NodeTextHelper extends TextHelper {
  public override async bufferToText(
    buf: Uint8Array,
    options: ConvertOptions
  ): Promise<string> {
    let buffer: Buffer;
    if ($().converterOf("buffer").match(buf, options)) {
      buffer = buf;
    } else {
      buffer = await $().converterOf("buffer").convert(buf);
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
