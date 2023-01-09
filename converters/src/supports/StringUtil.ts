import type * as ej from "encoding-japanese";
import type * as iconv from "iconv-lite";

export const BUFFER_ENCODINGS = ["ascii", "utf8", "utf16le", "ucs2", "latin1"];

let _decoder: TextDecoder;

export function getTextDecoder() {
  if (typeof _decoder === "undefined") {
    _decoder = new TextDecoder();
  }
  return _decoder;
}

let _encoder: TextEncoder;

export function getTextEncoder() {
  if (typeof _encoder === "undefined") {
    _encoder = new TextEncoder();
  }
  return _encoder;
}

export const EJ_ENCODINGS = ["utf32", "utf16be", "jis", "eucjp", "sjis"];

let _ej: typeof ej | null;

export async function getEncodingJapanese() {
  if (typeof _ej === "undefined") {
    try {
      _ej = await import("encoding-japanese");
    } catch {
      _ej = null;
    }
  }
  return _ej;
}

let _iconv: typeof iconv | null;

export async function getIconv() {
  if (typeof _iconv === "undefined") {
    try {
      _iconv = await import("iconv-lite");
    } catch (e) {
      _iconv = null;
    }
  }
  return _iconv;
}
