import u2a from "../../../converters/uint8array/arraybuffer";

it("convert", async () => {
  const src = new Uint8Array([20, 21, 22]);
  const actual = await u2a.convert(src);
  expect(actual.byteLength).toEqual(3);
  const u8 = new Uint8Array(actual);
  for (let i = 0; i < src.length; i++) {
    expect(u8.at(i)).toBe(src.at(i));
  }
});
