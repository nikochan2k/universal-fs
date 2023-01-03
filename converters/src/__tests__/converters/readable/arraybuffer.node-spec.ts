import r2a from "../../../converters/readable/arraybuffer.js";
import { createReadable } from "../../supports/Reader.js";

it("convert", async () => {
  const data = [97, 98, 99];
  const src = createReadable(data);
  const actual = await r2a.convert(src);
  const u8 = new Uint8Array(actual);
  expect(actual.byteLength).toEqual(3);
  for (let i = 0; i < data.length; i++) {
    expect(u8.at(i)).toBe(data[i]);
  }
});
