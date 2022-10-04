import { Charset } from "./core";
import { isNode } from "./util";

export interface TextHelper {
  bufferToText(u8: Uint8Array, bufCharset: Charset): Promise<string>;
  textToBuffer(text: string, bufCharset: Charset): Promise<Uint8Array>;
}

let textHelper: TextHelper | undefined;
export async function getTextHelper() {
  if (!textHelper) {
    if (isNode) {
      const module = await import("./NodeTextHelper");
      textHelper = module.NODE_TEXT_HELPER;
    } else {
      const module = await import("./DefaultTextHelper");
      textHelper = module.DEFAULT_TEXT_HELPER;
    }
  }
  return textHelper;
}
