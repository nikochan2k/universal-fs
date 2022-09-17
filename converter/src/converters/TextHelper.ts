import { Charset } from "./core";
import { isNode } from "./util";

export interface TextHelper {
  bufferToText(u8: Uint8Array, bufCharset: Charset): Promise<string>;
  textToBuffer(text: string, bufCharset: Charset): Promise<Uint8Array>;
}

let TEXT_HELPER: TextHelper;
/* eslint-disable */
export function textHelper() {
  if (!TEXT_HELPER) {
    if (isNode) {
      TEXT_HELPER = require("./NodeTextHelper").NODE_TEXT_HELPER;
    } else {
      TEXT_HELPER = require("./DefaultTextHelper").DEFAULT_TEXT_HELPER;
    }
  }
  return TEXT_HELPER;
}
