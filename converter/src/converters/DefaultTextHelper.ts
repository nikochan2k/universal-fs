import { Charset } from "./core";
import { TextHelper } from "./TextHelper";

if (!globalThis.TextDecoder || !globalThis.TextEncoder) {
  require("fast-text-encoding");
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let convert: any;
try {
  // eslint-disable-next-line
  convert = require("encoding-japanese").convert;
} catch {
  // Do nothing
}

function textToUtf16leBuffer(text: string) {
  const ab = new ArrayBuffer(text.length * 2);
  const u16 = new Uint16Array(ab);
  for (let i = 0, strLen = text.length; i < strLen; i++) {
    u16[i] = text.charCodeAt(i);
  }
  return ab;
}
export class DefaultTextHelper implements TextHelper {
  bufferToText(u8: Uint8Array, bufCharset: Charset): Promise<string> {
    if (bufCharset === "utf8") {
      return Promise.resolve(textDecoder.decode(u8));
    }
    if (bufCharset === "utf16le") {
      return Promise.resolve(String.fromCharCode.apply(null, Array.from(u8)));
    }
    if (convert) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return Promise.resolve(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          convert(u8, {
            to: "UNICODE",
            from: bufCharset.toUpperCase(),
            type: "string",
          })
        );
      } catch {
        // Do nothing
      }
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal encoding: " + bufCharset);
  }

  textToBuffer(text: string, bufCharset: Charset): Promise<Uint8Array> {
    if (bufCharset === "utf8") {
      return Promise.resolve(textEncoder.encode(text));
    }
    if (bufCharset === "utf16le") {
      const ab = textToUtf16leBuffer(text);
      return Promise.resolve(new Uint8Array(ab));
    }
    if (convert) {
      try {
        // eslint-disable-next-line
        const ab: ArrayBuffer = convert(text, {
          to: bufCharset.toUpperCase(),
          from: "UNICODE",
          type: "arraybuffer",
        });
        return Promise.resolve(new Uint8Array(ab));
      } catch {
        // Do nothing
      }
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    throw new Error("Illegal encoding: " + bufCharset);
  }
}

export const DEFAULT_TEXT_HELPER = new DefaultTextHelper();
