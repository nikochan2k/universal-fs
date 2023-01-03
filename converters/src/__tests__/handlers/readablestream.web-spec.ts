import rh from "../../handlers/readablestream.js";
import uh from "../../handlers/uint8array.js";
import { handleReadableStream } from "../../supports/WebStream.js";

const toBuffer = async (rs: ReadableStream<Uint8Array>) => {
  const chunks: Uint8Array[] = [];
  await handleReadableStream(rs, async (chunk) => {
    chunks.push(chunk);
    return Promise.resolve(true);
  });
  const u8 = await uh.merge(chunks);
  return u8;
};

const createReadableStream = (size: number) => {
  const u8 = new Uint8Array(size);
  return new ReadableStream<Uint8Array>({
    start: (controller) => {
      controller.enqueue(u8);
      controller.close();
    },
  });
};

it("empty", async () => {
  const actual = await rh.empty();
  expect(actual instanceof ReadableStream).toBe(true);
  const buffer = await toBuffer(actual);
  expect(buffer.length).toBe(0);
});

it("merge", async () => {
  let actual: ReadableStream<Uint8Array>;
  let buffer: Uint8Array;
  actual = await rh.merge([]);
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(0);
  const chunk0 = createReadableStream(0);
  actual = await rh.merge([chunk0]);
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(0);
  let chunk1 = createReadableStream(1);
  actual = await rh.merge([chunk1]);
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(1);
  chunk1 = createReadableStream(1);
  const chunk2 = createReadableStream(2);
  actual = await rh.merge([chunk1, chunk2]);
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(3);
  // continuous read => not readable
  actual = await rh.merge([chunk1, chunk2]);
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(0);
});

it("slice", async () => {
  let actual: ReadableStream<Uint8Array>;
  let buffer: Uint8Array;
  let notEmpty = createReadableStream(3);
  actual = await rh.slice(notEmpty, { length: 0 });
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(0);
  // notEmpty = createReadableStream(3);
  // continuous read
  actual = await rh.slice(notEmpty, { length: 1 });
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(1);
  notEmpty = createReadableStream(3);
  actual = await rh.slice(notEmpty, { start: 1 });
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(2);
  notEmpty = createReadableStream(3);
  actual = await rh.slice(notEmpty, { start: 1, length: 1 });
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(1);
  notEmpty = createReadableStream(3);
  actual = await rh.slice(notEmpty, { start: 1, length: 3 });
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(2);
  notEmpty = createReadableStream(3);
  actual = await rh.slice(notEmpty, { start: 3 });
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(0);
});
