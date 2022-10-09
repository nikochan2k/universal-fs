import { DEFAULT_CONVERTER as c } from "../AnyConv";
import {
  hasBlob,
  hasBuffer,
  hasReadableStream,
  isNode,
} from "../converters/NodeUtil";

const head = "大谷翔平";
const tail = "ホームラン";
const expected = "大谷翔平ホームラン";

it("arraybuffer", async () => {
  const chunk1 = await c.converterOf("arraybuffer").convert(head);
  const chunk2 = await c.converterOf("arraybuffer").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});

it("uint8array", async () => {
  const chunk1 = await c.converterOf("uint8array").convert(head);
  const chunk2 = await c.converterOf("uint8array").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});

it("buffer", async () => {
  if (!hasBuffer) {
    return;
  }

  const chunk1 = await c.converterOf("buffer").convert(head);
  const chunk2 = await c.converterOf("buffer").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});

it("blob", async () => {
  if (!hasBlob) {
    return;
  }

  const chunk1 = await c.converterOf("blob").convert(head);
  const chunk2 = await c.converterOf("blob").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});

it("base64", async () => {
  const chunk1 = await c.converterOf("base64").convert(head);
  const chunk2 = await c.converterOf("base64").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks, { srcStringType: "base64" });
  expect(expected).toBe(merged);
});

it("binary", async () => {
  const chunk1 = await c.converterOf("binary").convert(head);
  const chunk2 = await c.converterOf("binary").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks, { srcStringType: "binary" });
  expect(expected).toBe(merged);
});

it("readable", async () => {
  if (!isNode) {
    return;
  }

  const chunk1 = await c.converterOf("readable").convert(head);
  const chunk2 = await c.converterOf("readable").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});

it("readablestream", async () => {
  if (!hasReadableStream) {
    return;
  }

  const chunk1 = await c.converterOf("readablestream").convert(head);
  const chunk2 = await c.converterOf("readablestream").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});
