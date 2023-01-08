import { Readable } from "stream";
import rh from "../../manipulators/readable.js";

const toBuffer = (readable: Readable) => {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", (e) => reject(e));
    readable.on("data", (chunk) => chunks.push(chunk as Buffer));
  });
};

const createReadable = (size: number) => {
  return new Readable({
    read() {
      this.push(Buffer.alloc(size));
      this.push(null);
    },
  });
};

it("empty", async () => {
  const actual = await rh.empty();
  expect(actual instanceof Readable).toBe(true);
  const buffer = await toBuffer(actual);
  expect(buffer.length).toBe(0);
});

it("merge", async () => {
  let actual: Readable;
  let buffer: Buffer;
  actual = await rh.merge([]);
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(0);
  const chunk0 = createReadable(0);
  actual = await rh.merge([chunk0]);
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(0);
  let chunk1 = createReadable(1);
  actual = await rh.merge([chunk1]);
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(1);
  chunk1 = createReadable(1);
  const chunk2 = createReadable(2);
  actual = await rh.merge([chunk1, chunk2]);
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(3);
  // continuous read => not readable
  actual = await rh.merge([chunk1, chunk2]);
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(0);
});

it("slice", async () => {
  let actual: Readable;
  let buffer: Buffer;
  let notEmpty = createReadable(3);
  actual = await rh.slice(notEmpty, { length: 0 });
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(0);
  // notEmpty = createReadable(3);
  // continuous read
  actual = await rh.slice(notEmpty, { length: 1 });
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(1);
  notEmpty = createReadable(3);
  actual = await rh.slice(notEmpty, { start: 1 });
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(2);
  notEmpty = createReadable(3);
  actual = await rh.slice(notEmpty, { start: 1, length: 1 });
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(1);
  notEmpty = createReadable(3);
  actual = await rh.slice(notEmpty, { start: 1, length: 3 });
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(2);
  notEmpty = createReadable(3);
  actual = await rh.slice(notEmpty, { start: 3 });
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(0);
});
