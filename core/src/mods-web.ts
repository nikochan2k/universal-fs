import { closeStream, getUnivConv } from "univ-conv";
import { Modification } from "./core.js";

async function createModifiedReadableStream(
  src: ReadableStream<unknown>,
  ...mods: Modification[]
) {
  const conv = await getUnivConv();
  const reader = src.getReader();
  return new ReadableStream({
    start: async (controller) => {
      let iStart = 0;
      let done: boolean;
      do {
        const res = await reader.read();
        const value = res.value;
        done = res.done;
        if (!done) {
          const chunk = value as Uint8Array;
          const size = chunk.byteLength;
          try {
            const iEnd = iStart + size;
            for (const mod of mods) {
              const mStart = mod.start ?? 0;
              const mEnd = mStart + (mod.length ?? Number.MAX_SAFE_INTEGER);
              if (mStart <= iStart && iEnd <= mEnd) {
                /*
                (10)
                chunk:   |---|
                mod  : |-------|
                (11)
                chunk:    |----|
                mod  : |-------|
                (12)
                chunk: |-------|
                mod  : |-------|
                (13)
                chunk: |----|
                mod  : |-------|
                */
                const start = iStart - mStart;
                const length = size;
                controller.enqueue(
                  // eslint-disable-next-line
                  conv.slice(mod.data, { start, length })
                );
                return;
              } else if (iStart <= mStart && mStart <= iEnd) {
                /*
                (1)
                chunk: |-------|
                mod  :    |-------|
                (2)
                chunk: |-------|
                mod  :    |----|
                (3)
                chunk: |-------|
                mod  :    |--|
                (4)
                chunk: |-------|
                mod  : |----|
                */
                const chunkLen = mStart - iStart;
                if (0 < chunkLen) {
                  /*
                  (1)
                  chunk: |-------|
                  mod  :    |-------|
                  (2)
                  chunk: |-------|
                  mod  :    |----|
                  (3)
                  chunk: |-------|
                  mod  :    |--|
                  */
                  controller.enqueue(chunk.slice(0, chunkLen));
                }

                if (mEnd < iEnd) {
                  /*
                  (3)
                  chunk: |-------|
                  mod  :    |--|
                  (4)
                  chunk: |-------|
                  mod  : |----|
                  */
                  const modLen = mEnd - mStart;
                  controller.enqueue(
                    // eslint-disable-next-line
                    conv.slice(mod.data, {
                      start: 0,
                      length: modLen,
                    })
                  );
                  if (mEnd < iEnd) {
                    /*
                    (3)
                    chunk: |-------|
                    mod  :    |--|
                    (4)
                    chunk: |-------|
                    mod  : |----|
                    */
                    const start = mEnd - iStart;
                    const length = iEnd - mEnd;
                    controller.enqueue(chunk.slice(start, length));
                  }
                }
                return;
              } else if (mStart < iStart && iStart < mEnd) {
                /*
                (7)
                chunk:    |-------|
                mod  : |-------|
                (8)
                chunk:    |----|
                mod  : |-------|
                (9)
                chunk:    |--|
                mod  : |-------|
                */
                const start = iStart - mStart;
                let length: number;
                if (mEnd < iEnd) {
                  /*
                  (7)
                  chunk:    |-------|
                  mod  : |-------|
                  */
                  length = mEnd - iStart;
                } else {
                  /*
                  (8)
                  chunk:    |----|
                  mod  : |-------|
                  (9)
                  chunk:    |--|
                  mod  : |-------|
                  */
                  length = iEnd - iStart;
                }
                controller.enqueue(
                  // eslint-disable-next-line
                  conv.slice(mod.data, { start, length })
                );
                return;
              }

              controller.enqueue(chunk);
            }
          } finally {
            iStart += size;
          }
        }
      } while (!done);
      controller.close();
      reader.releaseLock();
      // eslint-disable-next-line
      closeStream(src);
    },
    cancel: (e) => {
      reader.releaseLock();
      // eslint-disable-next-line
      closeStream(src, e);
    },
  });
}

export default createModifiedReadableStream;
