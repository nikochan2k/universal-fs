import { PassThrough, Readable } from "stream";
import { AbstractManipulator, SliceOptions } from "../core.js";
import { isReadable } from "../supports/Environment.js";

const EMPTY_BUFFER = Buffer.alloc(0);

class PartialReadable extends Readable {
  constructor(
    private src: Readable,
    private start: number,
    private end = Number.MAX_SAFE_INTEGER
  ) {
    super();
    if (src.readableEncoding) {
      throw new Error(`Do not set encoding: ${src.readableEncoding}`);
    }
    src.once("readable", () => this.setup());
  }

  public override _read() {
    // noop
  }

  private setup() {
    let iStart = 0;
    const onData = (u8: Uint8Array) => {
      const size = u8.byteLength;
      const iEnd = iStart + size;
      const u8End = (iEnd < this.end ? iEnd : this.end) - iStart;
      let chunk: Uint8Array | undefined;
      if (iStart <= this.start && this.start < iEnd) {
        /*
        range :   |-------|
        buffer: |-------|
        range :   |-----|
        buffer: |-------|
        range :   |--|
        buffer: |-------|
        */
        chunk = u8.subarray(this.start - iStart, u8End);
      } else if (this.start < iStart && iStart < this.end) {
        /*
        range : |-------|
        buffer:   |-------|
        range : |-------|
        buffer:   |-----|
        */
        chunk = u8.subarray(0, u8End);
      }
      if (chunk) {
        this.push(chunk);
      }
      iStart += size;
      if (u8End < iStart) {
        src.emit("end");
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
}

class ReadableManipulator extends AbstractManipulator<Readable> {
  public name = Readable.name;

  public empty(): Promise<Readable> {
    return Promise.resolve(
      new Readable({
        read() {
          this.push(EMPTY_BUFFER);
          this.push(null);
        },
      })
    );
  }

  protected _isEmpty(): Promise<boolean> {
    throw new Error("Cannot check empty of Readable");
  }

  protected _merge(src: Readable[]): Promise<Readable> {
    const end = src.length;
    if (!src || end === 0) {
      return Promise.resolve(this.empty());
    }
    if (end === 1) {
      return Promise.resolve(src[0] as Readable);
    }

    const pt = new PassThrough();
    const process = (i: number) => {
      if (i < end) {
        const readable = src[i];
        if (!isReadable(readable)) {
          process(i + 1);
          return;
        }
        readable.once("error", (e) => {
          readable.unpipe();
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          pt.destroy(e);
          for (let j = i; j < end; j++) {
            const r = src[j];
            if (isReadable(r)) r.destroy();
          }
        });
        readable.once("end", () => process(i + 1));
        readable.pipe(pt, { end: false });
      } else {
        pt.end();
      }
    };
    process(0);
    return Promise.resolve(pt);
  }

  protected _size(): Promise<number> {
    throw new Error("Cannot get size of Readable");
  }

  protected _slice(src: Readable, options?: SliceOptions): Promise<Readable> {
    const start = options?.start ?? 0;
    let end: number | undefined;
    if (options?.length != null) {
      end = start + options.length;
    }
    if (!src.readable) {
      return this.empty();
    }
    return Promise.resolve(new PartialReadable(src, start, end));
  }

  protected _validateSource(src: unknown): src is Readable {
    return src instanceof Readable;
  }
}

export default new ReadableManipulator();
