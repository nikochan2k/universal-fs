import { hasBlob, hasBuffer, hasReadableStream, isNode } from "../converters";
import { DEFAULT_CONVERTER as c } from "../converver";

const head = "大谷翔平";
const tail = "ホームラン";
const expected = "大谷翔平ホームラン";

it("arraybuffer", async () => {
  const chunk1 = await c.toArrayBuffer(head);
  const chunk2 = await c.toArrayBuffer(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge(chunks, "text");
  expect(expected).toBe(merged);
});

it("uint8array", async () => {
  const chunk1 = await c.toUint8Array(head);
  const chunk2 = await c.toUint8Array(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge(chunks, "text");
  expect(expected).toBe(merged);
});

it("buffer", async () => {
  if (!hasBuffer) {
    return;
  }

  const chunk1 = await c.toBuffer(head);
  const chunk2 = await c.toBuffer(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge(chunks, "text");
  expect(expected).toBe(merged);
});

it("blob", async () => {
  if (!hasBlob) {
    return;
  }

  const chunk1 = await c.toBlob(head);
  const chunk2 = await c.toBlob(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge(chunks, "text");
  expect(expected).toBe(merged);
});

it("base64", async () => {
  const chunk1 = await c.toBase64(head);
  const chunk2 = await c.toBase64(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge(chunks, "text", { srcStringType: "base64" });
  expect(expected).toBe(merged);
});

it("binary", async () => {
  const chunk1 = await c.toBinary(head);
  const chunk2 = await c.toBinary(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge(chunks, "text", { srcStringType: "binary" });
  expect(expected).toBe(merged);
});

it("readable", async () => {
  if (!isNode) {
    return;
  }

  const chunk1 = await c.toReadable(head);
  const chunk2 = await c.toReadable(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge(chunks, "text");
  expect(expected).toBe(merged);
});

it("readablestream", async () => {
  if (!hasReadableStream) {
    return;
  }

  const chunk1 = await c.toReadableStream(head);
  const chunk2 = await c.toReadableStream(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge(chunks, "text");
  expect(expected).toBe(merged);
});
