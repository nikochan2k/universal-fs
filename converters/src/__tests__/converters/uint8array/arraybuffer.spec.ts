import u2a from "../../../converters/uint8array/arraybuffer.js";

it("convert", async () => {
  const src = new Uint8Array([97, 98, 99]);
  const actual = await u2a.convert(src);
  expect(actual.byteLength).toEqual(3);
  const actualU8 = new Uint8Array(actual);
  for (let i = 0; i < src.length; i++) {
    expect(actualU8.at(i)).toBe(src.at(i));
  }
});
