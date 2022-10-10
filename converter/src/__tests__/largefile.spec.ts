import { createWriteStream, rmSync, statSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { getAnyConv } from "../AnyConv";
import { AnyConvInternal } from "../converters/AbstractConverter";

const source = Buffer.alloc(1000 * 1024);

let c: AnyConvInternal;
it("initialize", async () => {
  c = (await getAnyConv()) as AnyConvInternal;
});

it("readable to uint8array", async () => {
  const readable = await c.convert("readable", source);
  const buffer = await c.convert("uint8array", readable);
  expect(source.byteLength).toBe(buffer.byteLength);
});

it("pipe readable", async () => {
  const readable = await c.convert("readable", source);
  const outPath = join(tmpdir(), `univ-fs-${Date.now()}.jpg`);
  const writable = createWriteStream(outPath);
  await c.pipe(readable, writable);
  const dstStats = statSync(outPath);
  rmSync(outPath);
  expect(dstStats.size).toBe(source.byteLength);
});
