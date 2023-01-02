export const DEFAULT_BUFFER_SIZE = 96 * 1024;

export let isBrowser = false;
export let isReactNative = false;
export let isNode = false;
if (typeof document !== "undefined") {
  isBrowser = true;
} else if (
  typeof navigator !== "undefined" &&
  navigator.product === "ReactNative"
) {
  isReactNative = true;
} else {
  isNode = true;
}

export const hasBuffer = typeof Buffer === "function";
export function newBuffer(input: number | number[] | ArrayBufferLike) {
  if (typeof input === "number") {
    return hasBuffer ? Buffer.alloc(input) : new Uint8Array(input);
  } else if (Array.isArray(input)) {
    return hasBuffer ? Buffer.from(input) : new Uint8Array(input);
  } else {
    return hasBuffer ? Buffer.from(input) : new Uint8Array(input);
  }
}

export function dataUrlToBase64(dataUrl: string) {
  const index = dataUrl.indexOf(",");
  if (0 <= index) {
    return dataUrl.substring(index + 1);
  }
  return dataUrl;
}
