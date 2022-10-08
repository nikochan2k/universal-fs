import { Duplex, PassThrough, Readable } from "stream";
import {
  blobConverter,
  bufferConverter,
  getTextHelper,
  readableStreamConverter,
} from "./converters";
import {
  AbstractConverter,
  ConvertOptions,
  Data,
  DataType,
  deleteStartLength,
  getStartEnd,
} from "./core";
import {
  EMPTY_BUFFER,
  fileURLToReadable,
  handleReadable,
  hasStreamOnBlob,
  isNode,
  isReadable,
} from "./util";

export class PartialReadable extends Readable {
  constructor(
    private src: Readable,
    private start: number,
    private end = Number.MAX_SAFE_INTEGER
  ) {
    super();
    src.once("readable", () => this.setup());
  }

  public override _read() {
    // noop
  }

  private setup() {
    let iStart = 0;
    const onData = (value: unknown) => {
      const u8 = value as Uint8Array;
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
        chunk = u8.slice(this.start - iStart, u8End);
      } else if (this.start < iStart && iStart < this.end) {
        /*
        range : |-------|
        buffer:   |-------|
        range : |-------|
        buffer:   |-----|
        */
        chunk = u8.slice(0, u8End);
      }
      if (chunk) {
        this.push(chunk);
      }
      iStart += size;
    };

    const src = this.src;
    src.once("error", (e) => {
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

class ReadableOfReadableStream extends Readable {
  constructor(
    private stream: ReadableStream<Uint8Array>,
    private start: number,
    private end = Number.MAX_SAFE_INTEGER
  ) {
    super();
    this.setup(); // eslint-disable-line @typescript-eslint/no-floating-promises
  }

  private async setup() {
    const reader = this.stream.getReader();
    try {
      const converter = bufferConverter();
      let iStart = 0;
      let done: boolean;
      do {
        const res = await reader.read();
        const value = res.value;
        done = res.done;
        if (value) {
          const u8 = await converter.convert(value as Data);
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
            chunk = u8.slice(this.start - iStart, u8End);
          } else if (this.start < iStart && iStart < this.end) {
            /*
            range : |-------|
            buffer:   |-------|
            range : |-------|
            buffer:   |-----|
            */
            chunk = u8.slice(0, u8End);
          }
          if (chunk) {
            this.push(chunk);
          }
          iStart += size;
        }
      } while (!done && iStart < this.end);
      this.push(null);
    } catch (e) {
      this.destroy(e as Error);
    } finally {
      reader.releaseLock();
      this.stream.cancel().catch((e) => console.debug(e));
    }
  }
}

class ReadableConverter extends AbstractConverter<Readable> {
  public type: DataType = "readable";

  public empty(): Readable {
    return new Readable({
      read() {
        this.push(EMPTY_BUFFER);
        this.push(null);
      },
    });
  }

  public typeEquals(input: unknown): input is Readable {
    return isReadable(input);
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<Readable | undefined> {
    if (typeof input === "string" && options.srcStringType === "url") {
      if (input.startsWith("http:") || input.startsWith("https:")) {
        const resp = await fetch(input);
        if (isNode) {
          input = resp.body as unknown as Readable;
        } else {
          input = resp.body as ReadableStream;
        }
      } else if (input.startsWith("file:") && fileURLToReadable) {
        input = await fileURLToReadable(input);
      }
    }
    if (blobConverter().typeEquals(input, options)) {
      if (hasStreamOnBlob) {
        input = input.stream() as unknown as ReadableStream;
      }
    }

    if (this.typeEquals(input)) {
      const { start, end } = getStartEnd(options);
      return new PartialReadable(input, start, end);
    }
    if (readableStreamConverter().typeEquals(input, options)) {
      const { start, end } = getStartEnd(options);
      return new ReadableOfReadableStream(input, start, end);
    }

    const buffer = await bufferConverter().convert(input, options);
    const duplex = new Duplex();
    duplex.push(buffer);
    duplex.push(null);
    return duplex;
  }

  protected _getSize(): Promise<number> {
    throw new Error("Cannot get size of Readable");
  }

  protected _getStartEnd(
    _input: Readable,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    return Promise.resolve(getStartEnd(options));
  }

  protected _isEmpty(input: Readable): boolean {
    return !input.readable;
  }

  protected _merge(readables: Readable[]): Promise<Readable> {
    const end = readables.length;
    if (!readables || end === 0) {
      return Promise.resolve(this.empty());
    }
    if (end === 1) {
      return Promise.resolve(readables[0] as Readable);
    }

    const pt = new PassThrough();
    const process = (i: number) => {
      if (i < end) {
        const readable = readables[i] as Readable;
        readable.once("error", (e) => {
          readable.unpipe();
          pt.destroy(e);
          for (let j = i; j < end; j++) {
            const r = readables[j] as Readable;
            r.destroy();
          }
        });
        readable.once("end", () => process(++i));
        readable.pipe(pt, { end: false });
      } else {
        pt.end();
      }
    };
    process(0);
    return Promise.resolve(pt);
  }

  protected async _toArrayBuffer(
    input: Readable,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const u8 = await this.toUint8Array(input, options);
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  }

  protected async _toBase64(
    input: Readable,
    options: ConvertOptions
  ): Promise<string> {
    const buffer = (await this.toUint8Array(input, options)) as Buffer;
    return await bufferConverter().toBase64(buffer, deleteStartLength(options));
  }

  protected async _toText(
    input: Readable,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    const textHelper = await getTextHelper();
    return await textHelper.bufferToText(u8, options);
  }

  protected async _toUint8Array(
    input: Readable,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const { start, end } = await this._getStartEnd(input, options);
    const bufferSize = options.bufferSize;

    let index = 0;
    const converter = bufferConverter();
    const chunks: Buffer[] = [];
    await handleReadable(input, async (chunk) => {
      const buffer = await converter.convert(chunk, { bufferSize });
      const size = buffer.byteLength;
      let e = index + size;
      if (end != null && end < e) e = end;
      if (index < start && start < e) {
        chunks.push(buffer.slice(start, e));
      } else if (start <= index) {
        chunks.push(buffer);
      }
      index += size;
      return end == null || index < end;
    });
    return Buffer.concat(chunks);
  }
}

export const INSTANCE = new ReadableConverter();
