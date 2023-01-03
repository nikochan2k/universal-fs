import b2a from "../../../converters/blob/arraybuffer.js";

it("convert", async () => {
  const u8 = new Uint8Array([97, 98, 99]);
  const src = new Blob([u8]);
  const actual = await b2a.convert(src);
  expect(actual.byteLength).toEqual(3);
  const actualU8 = new Uint8Array(actual);
  for (let i = 0; i < u8.length; i++) {
    expect(actualU8.at(i)).toBe(u8.at(i));
  }
});
