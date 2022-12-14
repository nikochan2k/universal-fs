import { createWriteStream, rmSync, statSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { getUnivConv } from "../UnivConv";
import { UnivConvInternal } from "../converters/AbstractConverter";

const source = Buffer.alloc(1000 * 1024);

let c: UnivConvInternal;
it("initialize", async () => {
  c = (await getUnivConv()) as UnivConvInternal;
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
