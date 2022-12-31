import u2b from "../../../converters/uint8array/blob";

it("convert", async () => {
  const src = new Uint8Array([97, 98, 99]);
  const actual = await u2b.convert(src);
  expect(actual.size).toEqual(3);
  const ab = await actual.arrayBuffer();
  const actualU8 = new Uint8Array(ab);
  for (let i = 0; i < src.length; i++) {
    expect(actualU8.at(i)).toBe(src.at(i));
  }
});
