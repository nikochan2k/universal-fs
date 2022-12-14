import { Readable } from "stream";
import { AbstractConverter, _ } from "./AbstractConverter";
import {
  ConvertOptions,
  Data,
  DataType,
  EMPTY_UINT8_ARRAY,
  getStartEnd,
  hasNoStartLength,
} from "./core.js";
import {
  closeStream,
  fileURLToReadable,
  handleReadable,
  handleReadableStream,
  hasStreamOnBlob,
  isBrowser,
  isReadable,
  isReadableStream,
} from "./Environment";

function createReadableStream(u8: Uint8Array) {
  return new ReadableStream<unknown>({
    start: (controller) => {
      controller.enqueue(u8);
    },
  });
}

export function createPartialReadableStream(
  source: ReadableStream<unknown>,
  startEnd: { start: number; end?: number }
) {
  const reader = source.getReader();
  const start = startEnd.start;
  const end = startEnd.end ?? Number.MAX_SAFE_INTEGER;
  return new ReadableStream({
    start: async (controller) => {
      let iStart = 0;
      let res: ReadableStreamReadResult<unknown>;
      do {
        res = await reader.read();
        const value = res.value;
        if (value) {
          const u8 = value as Uint8Array;
          const length = u8.byteLength;
          const iEnd = iStart + length;
          const u8End = (iEnd < end ? iEnd : end) - iStart;
          let chunk: Uint8Array | undefined;
          if (iStart <= start && start < iEnd) {
            /*
            range :   |-------|
            buffer: |-------|
            range :   |-----|
            buffer: |-------|
            range :   |--|
            buffer: |-------|
            */
            chunk = u8.subarray(start - iStart, u8End);
          } else if (start < iStart && iStart < end) {
            /*
            range : |-------|
            buffer:   |-------|
            range : |-------|
            buffer:   |-----|
            */
            chunk = u8.subarray(0, u8End);
          }
          if (chunk) {
            controller.enqueue(chunk);
          }
          iStart += length;
        }
      } while (!res.done && iStart < end);
      controller.close();
      reader.releaseLock();
      closeStream(source);
    },
    cancel: (e) => {
      reader.releaseLock();
      closeStream(source, e);
    },
  });
}

async function createReadableStreamOfReader(
  readable: NodeJS.ReadableStream,
  options: ConvertOptions
) {
  if (isReadable(readable) && typeof Readable.toWeb === "function") {
    const rs = Readable.toWeb(readable);
    if (hasNoStartLength(options)) {
      return rs;
    }
    return await _().convert("readablestream", rs, options);
  }

  const startEnd = getStartEnd(options);
  const start = startEnd.start;
  const end = startEnd.end ?? Number.MAX_SAFE_INTEGER;
  const bufferSize = options.bufferSize;
  const converter = _()._of("uint8array");
  let iStart = 0;
  return new ReadableStream({
    start: async (controller) => {
      await handleReadable(readable, async (value) => {
        const u8 = await converter.from(value, { bufferSize });
        const size = u8.byteLength;
        const iEnd = iStart + size;
        const u8End = (iEnd < end ? iEnd : end) - iStart;
        let chunk: Uint8Array | undefined;
        if (iStart <= start && start < iEnd) {
          /*
          range :   |-------|
          buffer: |-------|
          range :   |-----|
          buffer: |-------|
          range :   |--|
          buffer: |-------|
          */
          chunk = u8.subarray(start - iStart, u8End);
        } else if (start < iStart && iStart < end) {
          /*
          range : |-------|
          buffer:   |-------|
          range : |-------|
          buffer:   |-----|
          */
          chunk = u8.subarray(0, u8End);
        }
        if (chunk) {
          controller.enqueue(chunk);
        }
        iStart += size;
        return iStart < end;
      });
    },
    cancel: (err) => {
      if (isReadable(readable)) {
        readable.destroy(err as Error);
      }
    },
  });
}

export class ReadableStreamConverter extends AbstractConverter<
  ReadableStream<unknown>
> {
  public type: DataType = "readablestream";

  public empty(): ReadableStream<unknown> {
    return new ReadableStream({
      start: (converter) => {
        converter.enqueue(EMPTY_UINT8_ARRAY);
        converter.close();
      },
    });
  }

  public is(input: unknown): input is ReadableStream<unknown> {
    return isReadableStream(input);
  }

  protected async _from(
    input: Data,
    options: ConvertOptions
  ): Promise<ReadableStream<unknown>> {
    if (typeof input === "string" && options.inputStringType === "url") {
      if (input.startsWith("http:") || input.startsWith("https:")) {
        const resp = await fetch(input);
        if (_().is("readable", resp.body, options)) {
          input = resp.body as Readable;
        } else {
          input = resp.body as ReadableStream<unknown>;
        }
      } else if (input.startsWith("file:") && fileURLToReadable) {
        input = await fileURLToReadable(input);
      }
    }

    if (_().is("readable", input, options)) {
      return await createReadableStreamOfReader(input, options);
    }

    if (hasStreamOnBlob) {
      if (_().is("blob", input, options)) {
        input = input.stream() as unknown as ReadableStream<unknown>;
      } else {
        const blob = await _().convert("blob", input, options);
        input = blob.stream() as unknown as ReadableStream<unknown>;
      }
    }

    if (this.is(input)) {
      return createPartialReadableStream(
        input,
        await this._getStartEnd(input, options)
      );
    }

    const u8 = await _().convert("uint8array", input, options);
    const { start, end } = getStartEnd(options, u8.byteLength);
    return createReadableStream(u8.slice(start, end));
  }

  protected _getStartEnd(
    _input: ReadableStream<unknown>,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    return Promise.resolve(getStartEnd(options));
  }

  protected _isEmpty(): boolean {
    return false;
  }

  protected _merge(
    streams: ReadableStream<unknown>[]
  ): Promise<ReadableStream<unknown>> {
    const end = streams.length;
    const process = (
      controller: ReadableStreamController<unknown>,
      i: number
    ) => {
      if (i < end) {
        const stream = streams[i] as ReadableStream<unknown>;
        handleReadableStream(stream, (chunk) => {
          controller.enqueue(chunk);
          return Promise.resolve(true);
        })
          .then(() => process(controller, ++i))
          .catch((e) => {
            controller.error(e);
            for (let j = i; j < end; j++) {
              const s = streams[j] as ReadableStream<unknown>;
              closeStream(s);
            }
          });
      } else {
        controller.close();
      }
    };

    return Promise.resolve(
      new ReadableStream({
        start: (converter) => {
          process(converter, 0);
        },
      })
    );
  }

  protected _size(): Promise<number> {
    throw new Error("Cannot get size of ReadableStream");
  }

  protected async _toArrayBuffer(
    input: ReadableStream<unknown>,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const u8 = await this._toUint8Array(input, options);
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  }

  protected async _toBase64(
    input: ReadableStream<unknown>,
    options: ConvertOptions
  ): Promise<string> {
    const opts = { bufferSize: options.bufferSize };
    const t: DataType = isBrowser ? "blob" : "uint8array";
    const convertd = await _().convert(t, input, opts);
    return await _()._of(t).toBase64(convertd, options);
  }

  protected async _toText(
    input: ReadableStream<unknown>,
    options: ConvertOptions
  ): Promise<string> {
    const opts = { bufferSize: options.bufferSize };
    const t: DataType = isBrowser ? "blob" : "uint8array";
    const convertd = await _().convert(t, input, opts);
    return await _()._of(t).toText(convertd, options);
  }

  protected async _toUint8Array(
    input: ReadableStream<unknown>,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const chunks: Uint8Array[] = [];
    await handleReadableStream(input, async (chunk) => {
      chunks.push(chunk);
      return Promise.resolve(true);
    });
    return await _()._of("uint8array").merge(chunks, options);
  }
}
