import { isNode } from "./NodeUtil";
import { TextHelper } from "./TextHelper";

export function getType(input: unknown): string {
  const type = typeof input;
  if (type === "function" || type === "object") {
    // eslint-disable-next-line
    return (input as any)?.constructor?.name || String.toString.call(input);
  }
  return type;
}

export function dataUrlToBase64(dataUrl: string) {
  const index = dataUrl.indexOf(",");
  if (0 <= index) {
    return dataUrl.substring(index + 1);
  }
  return dataUrl;
}

let textHelper: TextHelper | undefined;
export async function getTextHelper() {
  if (!textHelper) {
    if (isNode) {
      textHelper = (await import("./NodeTextHelper")).NODE_TEXT_HELPER;
    } else {
      textHelper = (await import("./TextHelper")).TEXT_HELPER;
    }
  }
  return textHelper;
}
