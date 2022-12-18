import a2u from "../../../converters/arraybuffer/uint8array";

it("convert", async () => {
  const u8 = new Uint8Array([20, 21, 22]);
  const src = u8.buffer;
  const actual = await a2u.convert(src);
  expect(actual.byteLength).toEqual(3);
  for (let i = 0; i < src.byteLength; i++) {
    expect(actual.at(i)).toBe(u8.at(i));
  }
});
