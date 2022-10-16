import { Duplex, PassThrough, Readable } from "stream";
import { AbstractConverter, _ } from "./AbstractConverter";
import {
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
  hasReadable,
  isNodeJSReadableStream,
  isReadable,
} from "./Environment";
import { getTextHelper } from "./StringUtil";

export class PartialReadable extends Readable {
  constructor(
    private src: NodeJS.ReadableStream,
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

class ReadableOfReadableStream extends Readable {
  constructor(
    private stream: ReadableStream<unknown>,
    private start: number,
    private end = Number.MAX_SAFE_INTEGER
  ) {
    super();
    this.setup(); // eslint-disable-line @typescript-eslint/no-floating-promises
  }

  private async setup() {
    const reader = this.stream.getReader();
    try {
      const converter = _()._of("uint8array");
      let iStart = 0;
      let done: boolean;
      do {
        const res = await reader.read();
        const value = res.value;
        done = res.done;
        if (value) {
          const u8 = await converter.from(value as Data);
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

export class ReadableConverter extends AbstractConverter<Readable> {
  public type: DataType = "readable";

  public empty(): Readable {
    return new Readable({
      read() {
        this.push(EMPTY_BUFFER);
        this.push(null);
      },
    });
  }

  public is(input: unknown): input is Readable {
    return isNodeJSReadableStream(input);
  }

  protected async _from(
    input: Data,
    options: ConvertOptions
  ): Promise<Readable> {
    if (typeof input === "string" && options.inputStringType === "url") {
      if (input.startsWith("http:") || input.startsWith("https:")) {
        const resp = await fetch(input);
        if (hasReadable) {
          input = resp.body as unknown as Readable;
        } else {
          input = resp.body as ReadableStream;
        }
      } else if (input.startsWith("file:") && fileURLToReadable) {
        input = await fileURLToReadable(input);
      }
    }
    if (this.is(input)) {
      const { start, end } = getStartEnd(options);
      return new PartialReadable(input, start, end);
    }
    if (_().is("readablestream", input, options)) {
      const { start, end } = getStartEnd(options);
      return new ReadableOfReadableStream(input, start, end);
    }

    const buffer = await _().convert("uint8array", input, options);
    const duplex = new Duplex();
    duplex.push(buffer);
    duplex.push(null);
    return duplex;
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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          pt.destroy(e);
          for (let j = i; j < end; j++) {
            const r = readables[j];
            if (isReadable(r)) r.destroy();
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

  protected _size(): Promise<number> {
    throw new Error("Cannot get size of Readable");
  }

  protected async _toArrayBuffer(
    input: Readable,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const u8 = await this._toUint8Array(input, options);
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  }

  protected async _toBase64(
    input: Readable,
    options: ConvertOptions
  ): Promise<string> {
    const buffer = await this._toUint8Array(input, options);
    return await _()
      ._of("uint8array")
      .toBase64(buffer, deleteStartLength(options));
  }

  protected async _toText(
    input: Readable,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this._toUint8Array(input, options);
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
    const converter = _()._of("uint8array");
    const chunks: Uint8Array[] = [];
    await handleReadable(input, async (chunk) => {
      const buffer = await converter.from(chunk, { bufferSize });
      const size = buffer.byteLength;
      let e = index + size;
      if (end != null && end < e) e = end;
      if (index < start && start < e) {
        chunks.push(buffer.subarray(start, e));
      } else if (start <= index) {
        chunks.push(buffer);
      }
      index += size;
      return end == null || index < end;
    });
    return Buffer.concat(chunks);
  }
}
