import {
  BlockData,
  DEFAULT_CONVERTER,
  hasReadable,
  hasReadableStream,
} from "univ-conv";
import { Modification } from "./core";
import type { Readable } from "stream";

type createModifiedReadableStreamType = (
  src: ReadableStream<Uint8Array>,
  ...mods: Modification[]
) => ReadableStream;

interface ModifiedReadableType extends Readable {
  // eslint-disable-next-line @typescript-eslint/no-misused-new
  new (src: Readable, ...mods: Modification[]): ModifiedReadableType;
}

export let createModifiedReadableStream: createModifiedReadableStreamType;
if (hasReadableStream) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  createModifiedReadableStream = require("./mods-web");
}

export let ModifiedReadable: ModifiedReadableType;
if (hasReadable) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ModifiedReadable = require("./mods-node");
}

export async function modify(src: BlockData, ...mods: Modification[]) {
  const u8 = await $().convert(src, "uint8array");
  const size = u8.length;
  for (const mod of mods) {
    const start = mod.start ?? 0;
    if (size <= start) {
      continue;
    }
    let length: number;
    if (mod.length == null) {
      length = size - start;
    } else {
      length = mod.length;
      if (size < start + length) {
        length = size - start;
      }
    }
    const data = await $().toUint8Array(mod.data, { length });
    u8.set(data, start);
  }
  return u8;
}
