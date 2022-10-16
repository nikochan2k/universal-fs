import { hasBuffer } from "./Environment";
import { TextHelper } from "./TextHelper";

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
    if (hasBuffer) {
      textHelper = new (await import("./NodeTextHelper")).NodeTextHelper();
    } else {
      textHelper = new (await import("./TextHelper")).TextHelper();
    }
  }
  return textHelper;
}
