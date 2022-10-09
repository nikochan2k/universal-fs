import { getAnyConv } from "../AnyConv";
import { AnyConv } from "../converters/core";

const ab = new ArrayBuffer(1000 * 1024);

let c: AnyConv;
it("initialize", async () => {
  c = await getAnyConv();
});

it("readableStream to uint8Array", async () => {
  const readable = await c.convert("readablestream", ab);
  const buffer = await c.convert("uint8array", readable);
  expect(ab.byteLength).toBe(buffer.byteLength);
});

it("readableStream to blob", async () => {
  const readable = await c.convert("readablestream", ab);
  const blob = await c.convert("blob", readable);
  expect(ab.byteLength).toBe(blob.size);
});
