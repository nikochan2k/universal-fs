import { Readable } from "stream";
import { getUnivConv, UnivConv } from "univ-conv";
import { Modification } from "./core.js";

class ModifiedReadable extends Readable {
  private iStart = 0;
  private mods: Modification[];

  constructor(
    private conv: UnivConv,
    private src: NodeJS.ReadableStream,
    mods: Modification[]
  ) {
    super();
    this.mods = mods;
    src.once("readable", () => this.setup());
  }

  private setup() {
    const onData = (value: unknown) => {
      const chunk = value as Uint8Array;
      const size = chunk.byteLength;
      try {
        const iEnd = this.iStart + size;
        for (const mod of this.mods) {
          const mStart = mod.start ?? 0;
          const mEnd = mStart + (mod.length ?? Number.MAX_SAFE_INTEGER);
          if (mStart <= this.iStart && iEnd <= mEnd) {
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
            const start = this.iStart - mStart;
            const length = size;
            // eslint-disable-next-line
            this.push(this.conv.slice(mod.data, { start, length }));
            return;
          } else if (this.iStart <= mStart && mStart <= iEnd) {
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
            const chunkLen = mStart - this.iStart;
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
              this.push(chunk.slice(0, chunkLen));
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
              this.push(
                // eslint-disable-next-line
                this.conv.slice(mod.data, {
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
                const start = mEnd - this.iStart;
                const length = iEnd - mEnd;
                this.push(chunk.slice(start, length));
              }
            }
            return;
          } else if (mStart < this.iStart && this.iStart < mEnd) {
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
            const start = this.iStart - mStart;
            let length: number;
            if (mEnd < iEnd) {
              /*
              (7)
              chunk:    |-------|
              mod  : |-------|
              */
              length = mEnd - this.iStart;
            } else {
              /*
              (8)
              chunk:    |----|
              mod  : |-------|
              (9)
              chunk:    |--|
              mod  : |-------|
              */
              length = iEnd - this.iStart;
            }
            // eslint-disable-next-line
            this.push(this.conv.slice(mod.data, { start, length }));
            return;
          }

          this.push(chunk);
        }
      } finally {
        this.iStart += size;
      }
    };

    const src = this.src;
    src.once("error", (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.destroy(e);
      src.off("data", onData);
    });
    src.once("end", () => {
      this.push(null);
      src.off("data", onData);
    });
    src.on("data", onData);
  }

  public override _read() {
    // noop
  }
}

async function createModifiedReadable(
  src: NodeJS.ReadableStream,
  ...mods: Modification[]
) {
  const conv = await getUnivConv();
  return new ModifiedReadable(conv, src, mods);
}

export default createModifiedReadable;
