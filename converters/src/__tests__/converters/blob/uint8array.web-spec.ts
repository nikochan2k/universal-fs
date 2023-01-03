import b2u from "../../../converters/blob/uint8array.js";

it("convert", async () => {
  const u8 = new Uint8Array([97, 98, 99]);
  const src = new Blob([u8]);
  const actual = await b2u.convert(src);
  expect(actual.byteLength).toEqual(3);
  for (let i = 0; i < u8.byteLength; i++) {
    expect(actual.at(i)).toBe(u8.at(i));
  }
});
