import { Readable } from "stream";
import rh from "../../handlers/readable";

const toBuffer = (readable: Readable) => {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", (e) => reject(e));
    readable.on("data", (chunk) => chunks.push(chunk as Buffer));
  });
};

it("empty", async () => {
  const actual = await rh.empty();
  expect(actual instanceof Readable).toBe(true);
  const buffer = await toBuffer(actual);
  expect(buffer.length).toBe(0);
});

it("merge", async () => {
  const chunk0 = new Readable({
    read() {
      this.push(Buffer.alloc(0));
      this.push(null);
    },
  });
  const chunk1 = new Readable({
    read() {
      this.push(Buffer.alloc(1));
      this.push(null);
    },
  });
  const chunk2 = new Readable({
    read() {
      this.push(Buffer.alloc(2));
      this.push(null);
    },
  });
  let actual: Readable;
  let buffer: Buffer;
  actual = await rh.merge([]);
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(0);
  actual = await rh.merge([chunk0]);
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(0);
  actual = await rh.merge([chunk1]);
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(1);
  actual = await rh.merge([chunk1, chunk2]);
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(3);
});

it("slice", async () => {
  const notEmpty = new Readable({
    read() {
      this.push(Buffer.alloc(3));
      this.push(null);
    },
  });
  let actual: Readable;
  let buffer: Buffer;
  actual = await rh.slice(notEmpty, { length: 0 });
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(0);
  actual = await rh.slice(notEmpty, { length: 1 });
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(1);
  actual = await rh.slice(notEmpty, { start: 1 });
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(2);
  actual = await rh.slice(notEmpty, { start: 1, length: 1 });
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(1);
  actual = await rh.slice(notEmpty, { start: 1, length: 3 });
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(2);
  actual = await rh.slice(notEmpty, { start: 3 });
  buffer = await toBuffer(actual);
  expect(buffer.length).toBe(0);
});
