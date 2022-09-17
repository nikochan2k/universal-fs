import { DEFAULT_CONVERTER as c } from "../converver";

const ab = new ArrayBuffer(1000 * 1024);

it("readableStream to uint8Array", async () => {
  const readable = await c.convert(ab, "readablestream");
  const buffer = await c.convert(readable, "uint8array");
  expect(ab.byteLength).toBe(buffer.byteLength);
});

it("readableStream to blob", async () => {
  const readable = await c.convert(ab, "readablestream");
  const blob = await c.convert(readable, "blob");
  expect(ab.byteLength).toBe(blob.size);
});
