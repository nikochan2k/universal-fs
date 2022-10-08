import type { Readable } from "stream";
import { Converter } from "./core";
import { FalseConverter } from "./FalseConverter";
import { TextHelper } from "./TextHelper";
import {
  EMPTY_BLOB,
  EMPTY_BUFFER,
  hasReadable,
  hasReadableStream,
  isNode,
} from "./util";

/* eslint-disable */

let ARRAY_BUFFER_CONVERTER: Converter<ArrayBuffer>;
export function arrayBufferConverter() {
  if (!ARRAY_BUFFER_CONVERTER) {
    ARRAY_BUFFER_CONVERTER = require("./ArrayBufferConverter").INSTANCE;
  }
  return ARRAY_BUFFER_CONVERTER;
}

let UINT8_ARRAY_CONVERTER: Converter<Uint8Array>;
export function uint8ArrayConverter() {
  if (!UINT8_ARRAY_CONVERTER) {
    UINT8_ARRAY_CONVERTER = require("./Uint8ArrayConverter").INSTANCE;
  }
  return UINT8_ARRAY_CONVERTER;
}

let BASE64_CONVERTER: Converter<string>;
export function base64Converter() {
  if (!BASE64_CONVERTER) {
    BASE64_CONVERTER = require("./Base64Converter").INSTANCE;
  }
  return BASE64_CONVERTER;
}

let BINARY_CONVERTER: Converter<string>;
export function binaryConverter() {
  if (!BINARY_CONVERTER) {
    BINARY_CONVERTER = require("./BinaryConverter").INSTANCE;
  }
  return BINARY_CONVERTER;
}

let HEX_CONVERTER: Converter<string>;
export function hexConverter() {
  if (!HEX_CONVERTER) {
    HEX_CONVERTER = require("./HexConverter").INSTANCE;
  }
  return HEX_CONVERTER;
}

let URL_CONVERTER: Converter<string>;
export function urlConverter() {
  if (!URL_CONVERTER) {
    URL_CONVERTER = require("./URLConverter").INSTANCE;
  }
  return URL_CONVERTER;
}

let TEXT_CONVERTER: Converter<string>;
export function textConverter() {
  if (!TEXT_CONVERTER) {
    TEXT_CONVERTER = require("./TextConverter").INSTANCE;
  }
  return TEXT_CONVERTER;
}

let BUFFER_CONVERTER: Converter<Buffer>;
export function bufferConverter() {
  if (!BUFFER_CONVERTER) {
    if (EMPTY_BUFFER) {
      BUFFER_CONVERTER = require("./BufferConverter").INSTANCE;
    } else {
      BUFFER_CONVERTER = new FalseConverter("Buffer");
    }
  }
  return BUFFER_CONVERTER;
}

let BLOB_CONVERTER: Converter<Blob>;
export function blobConverter() {
  if (!BLOB_CONVERTER) {
    if (EMPTY_BLOB) {
      BLOB_CONVERTER = require("./BlobConverter").INSTANCE;
    } else {
      BLOB_CONVERTER = new FalseConverter("Blob");
    }
  }
  return BLOB_CONVERTER;
}

let READABLE_CONVERTER: Converter<Readable>;
export function readableConverter() {
  if (!READABLE_CONVERTER) {
    if (hasReadable) {
      READABLE_CONVERTER = require("./ReadableConverter").INSTANCE;
    } else {
      READABLE_CONVERTER = new FalseConverter("Readable");
    }
  }
  return READABLE_CONVERTER;
}

let READABLE_STREAM_CONVERTER: Converter<ReadableStream<Uint8Array>>;
export function readableStreamConverter() {
  if (!READABLE_STREAM_CONVERTER) {
    if (hasReadableStream) {
      READABLE_STREAM_CONVERTER = require("./ReadableStreamConverter").INSTANCE;
    } else {
      READABLE_STREAM_CONVERTER = new FalseConverter("ReadableStream");
    }
  }
  return READABLE_STREAM_CONVERTER;
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
