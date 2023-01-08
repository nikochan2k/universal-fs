import { AbstractManipulator, SliceOptions } from "../core.js";
import {
  closeReadableStream,
  handleReadableStream,
} from "../supports/WebStream.js";

const EMPTY_UINT8_ARRAY = new Uint8Array(0);

export function createPartialReadableStream(
  src: ReadableStream<Uint8Array>,
  start: number,
  end = Number.MAX_SAFE_INTEGER
): ReadableStream<Uint8Array> {
  const reader = src.getReader();
  return new ReadableStream({
    start: async (controller) => {
      let iStart = 0;
      let res = await reader.read();
      while (!res.done && iStart < end) {
        const u8 = res.value;
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
        res = await reader.read();
      }
      controller.close();
      reader.releaseLock();
      closeReadableStream(src);
    },
    cancel: (e) => {
      reader.releaseLock();
      closeReadableStream(src, e);
    },
  });
}

class ReadableStreamManipulator extends AbstractManipulator<
  ReadableStream<Uint8Array>
> {
  public name = ReadableStream.name;

  public empty(): Promise<ReadableStream<Uint8Array>> {
    return Promise.resolve(
      new ReadableStream({
        start: (converter) => {
          converter.enqueue(EMPTY_UINT8_ARRAY);
          converter.close();
        },
      })
    );
  }

  protected _isEmpty(): Promise<boolean> {
    throw new Error("Cannot check empty of ReadableStream");
  }

  protected _merge(
    src: ReadableStream<Uint8Array>[]
  ): Promise<ReadableStream<Uint8Array>> {
    const end = src.length;
    const process = (
      controller: ReadableStreamController<unknown>,
      i: number
    ) => {
      if (i < end) {
        const stream = src[i] as ReadableStream<Uint8Array>;
        handleReadableStream(stream, (chunk) => {
          controller.enqueue(chunk);
          return Promise.resolve();
        })
          .then(() => process(controller, ++i))
          .catch((e) => {
            controller.error(e);
            for (let j = i; j < end; j++) {
              const s = src[j] as ReadableStream<Uint8Array>;
              closeReadableStream(s);
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
    throw new Error("Cannot check empty of ReadableStream");
  }

  protected _slice(
    src: ReadableStream<Uint8Array>,
    options?: SliceOptions
  ): Promise<ReadableStream<Uint8Array>> {
    const start = options?.start ?? 0;
    let end: number | undefined;
    if (options?.length != null) {
      end = start + options.length;
    }
    const rs = createPartialReadableStream(src, start, end);
    return Promise.resolve(rs);
  }

  protected _validateSource(src: unknown): src is ReadableStream<Uint8Array> {
    return src instanceof ReadableStream<Uint8Array>;
  }
}

export default new ReadableStreamManipulator();
