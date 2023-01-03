import a2u from "../../../converters/arraybuffer/uint8array.js";

it("convert", async () => {
  const u8 = new Uint8Array([97, 98, 99]);
  const src = u8.buffer;
  const actual = await a2u.convert(src);
  expect(actual.byteLength).toEqual(3);
  for (let i = 0; i < src.byteLength; i++) {
    expect(actual.at(i)).toBe(u8.at(i));
  }
});
