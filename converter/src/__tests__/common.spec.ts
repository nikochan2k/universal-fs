import { hasBlob, hasBuffer, hasReadableStream, isNode } from "../converters";
import { DEFAULT_CONVERTER as c } from "../AnyConv";

const head = "大谷翔平";
const tail = "ホームラン";
const expected = "大谷翔平ホームラン";

it("arraybuffer", async () => {
  const chunk1 = await c.of("arraybuffer").convert(head);
  const chunk2 = await c.of("arraybuffer").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});

it("uint8array", async () => {
  const chunk1 = await c.of("uint8array").convert(head);
  const chunk2 = await c.of("uint8array").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});

it("buffer", async () => {
  if (!hasBuffer) {
    return;
  }

  const chunk1 = await c.of("buffer").convert(head);
  const chunk2 = await c.of("buffer").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});

it("blob", async () => {
  if (!hasBlob) {
    return;
  }

  const chunk1 = await c.of("blob").convert(head);
  const chunk2 = await c.of("blob").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});

it("base64", async () => {
  const chunk1 = await c.of("base64").convert(head);
  const chunk2 = await c.of("base64").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks, { srcStringType: "base64" });
  expect(expected).toBe(merged);
});

it("binary", async () => {
  const chunk1 = await c.of("binary").convert(head);
  const chunk2 = await c.of("binary").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks, { srcStringType: "binary" });
  expect(expected).toBe(merged);
});

it("readable", async () => {
  if (!isNode) {
    return;
  }

  const chunk1 = await c.of("readable").convert(head);
  const chunk2 = await c.of("readable").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});

it("readablestream", async () => {
  if (!hasReadableStream) {
    return;
  }

  const chunk1 = await c.of("readablestream").convert(head);
  const chunk2 = await c.of("readablestream").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});
