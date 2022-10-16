import type { Readable } from "stream";
import {
  BlockData,
  getUnivConv,
  hasReadable,
  hasReadableStream,
} from "univ-conv";
import { Modification } from "./core";

type createModifiedReadableType = (
  src: NodeJS.ReadableStream,
  ...mods: Modification[]
) => Promise<Readable>;

type createModifiedReadableStreamType = (
  src: ReadableStream<unknown>,
  ...mods: Modification[]
) => Promise<ReadableStream>;

let _createModifiedReadable: createModifiedReadableType | undefined;
let _createModifiedReadableStream: createModifiedReadableStreamType | undefined;

let initialized = false;
export async function initialize() {
  if (initialized) {
    return;
  }
  initialized = true;

  if (hasReadable) {
    _createModifiedReadable = (await import("./mods-node")).default;
  }
  if (hasReadableStream) {
    _createModifiedReadableStream = (await import("./mods-web")).default;
  }
}

export const createModifiedReadable: createModifiedReadableType = async (
  src,
  mods
) => {
  await initialize();
  if (_createModifiedReadable) {
    return _createModifiedReadable(src, mods);
  }
  throw new Error("createModifiedReadable is undefined");
};

export const createModifiedReadableStream: createModifiedReadableStreamType =
  async (src, mods) => {
    await initialize();
    if (_createModifiedReadableStream) {
      return _createModifiedReadableStream(src, mods);
    }
    throw new Error("createModifiedReadableStream is undefined");
  };

export async function modify(src: BlockData, ...mods: Modification[]) {
  const conv = await getUnivConv();
  const u8 = await conv.convert("uint8array", src);
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
    const data = await conv.convert("uint8array", mod.data, { length });
    u8.set(data, start);
  }
  return u8;
}
