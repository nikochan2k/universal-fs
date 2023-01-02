import r2u from "../../../converters/reader/uint8array";
import { createReadable } from "./util";

it("convert", async () => {
  const data = [97, 98, 99];
  const src = createReadable([97, 98, 99]);
  const actual = await r2u.convert(src);
  expect(actual.byteLength).toEqual(3);
  for (let i = 0; i < data.length; i++) {
    expect(actual.at(i)).toBe(data[i]);
  }
});
