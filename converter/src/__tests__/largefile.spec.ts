import { createWriteStream, rmSync, statSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { DEFAULT_CONVERTER as c } from "../converver";

const source = Buffer.alloc(1000 * 1024);

it("readable to buffer", async () => {
  const readable = await c.convert(source, "readable");
  const buffer = await c.convert(readable, "buffer");
  expect(source.byteLength).toBe(buffer.byteLength);
});

it("readable to uint8array", async () => {
  const readable = await c.convert(source, "readable");
  const buffer = await c.convert(readable, "uint8array");
  expect(source.byteLength).toBe(buffer.byteLength);
});

it("pipe readable", async () => {
  const readable = await c.convert(source, "readable");
  const outPath = join(tmpdir(), `univ-fs-${Date.now()}.jpg`);
  const writable = createWriteStream(outPath);
  await c.pipe(readable, writable);
  const dstStats = statSync(outPath);
  rmSync(outPath);
  expect(dstStats.size).toBe(source.byteLength);
});
