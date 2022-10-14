import { getAnyConv } from "../AnyConv";
import { AnyConvInternal } from "../converters/AbstractConverter";
import {
  hasBlob,
  hasReadable,
  hasReadableStream,
} from "../converters/Environment";

const head = "大谷翔平";
const tail = "ホームラン";
const expected = "大谷翔平ホームラン";

let c: AnyConvInternal;
it("initialize", async () => {
  c = (await getAnyConv()) as AnyConvInternal;
});

it("arraybuffer", async () => {
  const chunk1 = await c._of("arraybuffer").from(head);
  const chunk2 = await c._of("arraybuffer").from(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});

it("uint8array", async () => {
  const chunk1 = await c._of("uint8array").from(head);
  const chunk2 = await c._of("uint8array").from(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});

it("blob", async () => {
  if (!hasBlob) {
    return;
  }

  const chunk1 = await c._of("blob").from(head);
  const chunk2 = await c._of("blob").from(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});

it("base64", async () => {
  const chunk1 = await c._of("base64").from(head);
  const chunk2 = await c._of("base64").from(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks, { inputStringType: "base64" });
  expect(expected).toBe(merged);
});

it("binary", async () => {
  const chunk1 = await c._of("binary").from(head);
  const chunk2 = await c._of("binary").from(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks, { inputStringType: "binary" });
  expect(expected).toBe(merged);
});

it("readable", async () => {
  if (!hasReadable) {
    return;
  }

  const chunk1 = await c._of("readable").from(head);
  const chunk2 = await c._of("readable").from(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});

it("readablestream", async () => {
  if (!hasReadableStream) {
    return;
  }

  const chunk1 = await c._of("readablestream").from(head);
  const chunk2 = await c._of("readablestream").from(tail);
  const chunks = [chunk1, chunk2];
  const merged = await c.merge("text", chunks);
  expect(expected).toBe(merged);
});
