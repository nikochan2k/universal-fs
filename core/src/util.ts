import { DEFAULT_STATS_KEYS, Stats } from "./core";
import { createError, SyntaxError } from "./errors";

// eslint-disable-next-line no-control-regex
export const INVALID_CHARS = /[\x00-\x1F\x7F-\x9F\\:*"<>|]/;

export function getPathParts(path: string) {
  const parts = path.split("/");
  const pathParts = [];
  for (const part of parts) {
    if (part === "..") {
      // Go up one level.
      if (pathParts.length === 0) {
        throw createError({
          message: "Illegal path",
          name: SyntaxError.name,
          path,
        });
      }
      pathParts.pop();
    } else if (part === ".") {
      // Skip over the current directory.
    } else if (part !== "") {
      // Eliminate sequences of '/'s as well as possible leading/trailing '/'s.
      pathParts.push(part);
    }
  }
  return pathParts;
}

export function getParentPath(path: string) {
  let parts = getPathParts(path);
  if (parts.length <= 1) {
    return "/";
  }
  parts = parts.slice(0, -1);
  return "/" + parts.join("/");
}

export function getName(path: string): string {
  const parts = getPathParts(path);
  if (parts.length === 0) {
    return "";
  }
  return parts[parts.length - 1] as string;
}

export function joinPaths(path1: string, path2: string, leadingSlash = true) {
  const parts1 = getPathParts(path1);
  const parts2 = getPathParts(path2);
  const parts = [...parts1, ...parts2];
  return (leadingSlash ? "/" : "") + parts.join("/");
}

export function normalizePath(path: string, leadingSlash = true) {
  const parts = getPathParts(path);
  return (leadingSlash ? "/" : "") + parts.join("/");
}

export function isIllegalFileName(name: string) {
  return /[\x00-\x1f\x7f-\x9f\\/:*?"<>|]/.test(name); // eslint-disable-line
}

export function createMetadata(props: Stats) {
  const metadata: { [key: string]: string } = {};
  for (const [key, value] of Object.entries(props)) {
    if (0 <= DEFAULT_STATS_KEYS.indexOf(key)) continue;
    if (value == null) continue;
    metadata[key] = value.toString();
  }
  return metadata;
}

const LUT_HEX_4b = new Array(0x10);
for (let n = 0; n < 0x10; n++) {
  LUT_HEX_4b[n] = n.toString(16);
}

const LUT_HEX_8b = new Array(0x100);
for (let n = 0; n < 0x100; n++) {
  LUT_HEX_8b[n] = `${LUT_HEX_4b[(n >>> 4) & 0xf]}${LUT_HEX_4b[n & 0xf]}`; // eslint-disable-line
}

export function toHex(u8: Uint8Array) {
  return u8.reduce((result, i) => result + LUT_HEX_8b[i], ""); // eslint-disable-line
}
