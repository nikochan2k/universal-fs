import { getAnyConv } from "../AnyConv";
import { AnyConvInternal } from "../converters/core";
import { hasBlob, hasReadableStream, isNode } from "../converters/NodeUtil";

const head = "大谷翔平";
const tail = "ホームラン";
const expected = "大谷翔平ホームラン";

let c: AnyConvInternal;
it("initialize", async () => {
  c = (await getAnyConv()) as AnyConvInternal;
});

it("arraybuffer", async () => {
  const chunk1 = await c._of("arraybuffer").convert(head);
  const chunk2 = await c._of("arraybuffer").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});

it("uint8array", async () => {
  const chunk1 = await c._of("uint8array").convert(head);
  const chunk2 = await c._of("uint8array").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});

it("blob", async () => {
  if (!hasBlob) {
    return;
  }

  const chunk1 = await c._of("blob").convert(head);
  const chunk2 = await c._of("blob").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});

it("base64", async () => {
  const chunk1 = await c._of("base64").convert(head);
  const chunk2 = await c._of("base64").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks, { srcStringType: "base64" });
  expect(expected).toBe(merged);
});

it("binary", async () => {
  const chunk1 = await c._of("binary").convert(head);
  const chunk2 = await c._of("binary").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks, { srcStringType: "binary" });
  expect(expected).toBe(merged);
});

it("readable", async () => {
  if (!isNode) {
    return;
  }

  const chunk1 = await c._of("readable").convert(head);
  const chunk2 = await c._of("readable").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});

it("readablestream", async () => {
  if (!hasReadableStream) {
    return;
  }

  const chunk1 = await c._of("readablestream").convert(head);
  const chunk2 = await c._of("readablestream").convert(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});
