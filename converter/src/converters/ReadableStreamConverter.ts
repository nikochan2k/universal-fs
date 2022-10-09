import type { Readable } from "stream";
import { C, AbstractConverter } from "./AbstractConverter";
import {
  ConvertOptions,
  Data,
  DataType,
  EMPTY_UINT8_ARRAY,
  getStartEnd,
} from "./core";
import {
  closeStream,
  fileURLToReadable,
  handleReadable,
  handleReadableStream,
  hasStreamOnBlob,
  isBrowser,
  isNode,
  isReadableStream,
} from "./NodeUtil";

function createReadableStream(u8: Uint8Array) {
  return new ReadableStream<Uint8Array>({
    start: (controller) => {
      controller.enqueue(u8);
    },
  });
}

export function createPartialReadableStream(
  source: ReadableStream<Uint8Array>,
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
            chunk = u8.slice(start - iStart, u8End);
          } else if (start < iStart && iStart < end) {
            /*
            range : |-------|
            buffer:   |-------|
            range : |-------|
            buffer:   |-----|
            */
            chunk = u8.slice(0, u8End);
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

function createReadableStreamOfReader(
  readable: Readable,
  options: ConvertOptions
) {
  const startEnd = getStartEnd(options);
  const start = startEnd.start;
  const end = startEnd.end ?? Number.MAX_SAFE_INTEGER;
  const bufferSize = options.bufferSize;
  const converter = C().converterOf("uint8array");
  let iStart = 0;
  return new ReadableStream({
    start: async (controller) => {
      await handleReadable(readable, async (value) => {
        const u8 = await converter.convert(value, { bufferSize });
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
          chunk = u8.slice(start - iStart, u8End);
        } else if (start < iStart && iStart < end) {
          /*
          range : |-------|
          buffer:   |-------|
          range : |-------|
          buffer:   |-----|
          */
          chunk = u8.slice(0, u8End);
        }
        if (chunk) {
          controller.enqueue(chunk);
        }
        iStart += size;
        return iStart < end;
      });
    },
    cancel: (err) => {
      readable.destroy(err as Error);
    },
  });
}

export class ReadableStreamConverter extends AbstractConverter<
  ReadableStream<Uint8Array>
> {
  public type: DataType = "readablestream";

  public empty(): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start: (converter) => {
        converter.enqueue(EMPTY_UINT8_ARRAY);
        converter.close();
      },
    });
  }

  public match(input: unknown): input is ReadableStream<Uint8Array> {
    return isReadableStream(input);
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<ReadableStream<Uint8Array> | undefined> {
    if (typeof input === "string" && options.srcStringType === "url") {
      if (input.startsWith("http:") || input.startsWith("https:")) {
        const resp = await fetch(input);
        if (C().converterOf("readable").match(resp.body, options)) {
          input = resp.body as unknown as Readable;
        } else {
          input = resp.body as ReadableStream<Uint8Array>;
        }
      } else if (input.startsWith("file:") && fileURLToReadable) {
        input = await fileURLToReadable(input);
      }
    }
    if (C().converterOf("blob").match(input, options) && hasStreamOnBlob) {
      input = input.stream() as unknown as ReadableStream<Uint8Array>;
    }

    if (C().converterOf("readable").match(input, options)) {
      return createReadableStreamOfReader(input, options);
    }

    if (!this.match(input) && hasStreamOnBlob) {
      const blob = await C().converterOf("blob").convert(input, options);
      input = blob.stream() as unknown as ReadableStream<Uint8Array>;
    }

    if (this.match(input)) {
      return createPartialReadableStream(
        input,
        await this._getStartEnd(input, options)
      );
    }

    const u8 = await C().converterOf("uint8array").convert(input, options);
    const { start, end } = getStartEnd(options, u8.byteLength);
    return createReadableStream(u8.slice(start, end));
  }

  protected _getSize(): Promise<number> {
    throw new Error("Cannot get size of ReadableStream");
  }

  protected _getStartEnd(
    _input: ReadableStream<Uint8Array>,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    return Promise.resolve(getStartEnd(options));
  }

  protected _isEmpty(): boolean {
    return false;
  }

  protected _merge(
    streams: ReadableStream<Uint8Array>[]
  ): Promise<ReadableStream<Uint8Array>> {
    const end = streams.length;
    const process = (
      controller: ReadableStreamController<unknown>,
      i: number
    ) => {
      if (i < end) {
        const stream = streams[i] as ReadableStream<Uint8Array>;
        handleReadableStream(stream, (chunk) => {
          controller.enqueue(chunk);
          return Promise.resolve(true);
        })
          .then(() => process(controller, ++i))
          .catch((e) => {
            controller.error(e);
            for (let j = i; j < end; j++) {
              const s = streams[j] as ReadableStream<Uint8Array>;
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

  protected async _toArrayBuffer(
    input: ReadableStream<Uint8Array>,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    const u8 = await this.toUint8Array(input, options);
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  }

  protected async _toBase64(
    input: ReadableStream<Uint8Array>,
    options: ConvertOptions
  ): Promise<string> {
    const bufferSize = options.bufferSize;
    if (isBrowser) {
      const blob = await C().converterOf("blob").convert(input, {
        bufferSize,
      });
      return await C().converterOf("blob").toBase64(blob, options);
    } else if (isNode) {
      const buffer = await C().converterOf("buffer").convert(input, {
        bufferSize,
      });
      return await C().converterOf("buffer").toBase64(buffer, options);
    } else {
      const u8 = await C().converterOf("uint8array").convert(input, {
        bufferSize,
      });
      return await C().converterOf("uint8array").toBase64(u8, options);
    }
  }

  protected async _toText(
    input: ReadableStream<Uint8Array>,
    options: ConvertOptions
  ): Promise<string> {
    const bufferSize = options.bufferSize;
    if (isBrowser) {
      const blob = await C().converterOf("blob").convert(input, {
        bufferSize,
      });
      return await C().converterOf("blob").toText(blob, options);
    } else if (isNode) {
      const buffer = await C().converterOf("buffer").convert(input, {
        bufferSize,
      });
      return await C().converterOf("buffer").toText(buffer, options);
    } else {
      const u8 = await C().converterOf("uint8array").convert(input, {
        bufferSize,
      });
      return await C().converterOf("uint8array").toText(u8, options);
    }
  }

  protected async _toUint8Array(
    input: ReadableStream<Uint8Array>,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const chunks: Uint8Array[] = [];
    await handleReadableStream(input, async (chunk) => {
      chunks.push(chunk);
      return Promise.resolve(true);
    });
    const converter = C().converterOf("uint8array");
    return await converter.merge(chunks, options);
  }
}

export const INSTANCE = new ReadableStreamConverter();
