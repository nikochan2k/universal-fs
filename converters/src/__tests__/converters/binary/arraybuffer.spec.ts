import b2a from "../../../converters/binary/arraybuffer";

it("convert", async () => {
  const src = "abc";
  const actual = await b2a.convert(src, { srcType: "binary" });
  expect(actual.byteLength).toEqual(3);
  const u8 = new Uint8Array(actual);
  for (let i = 0; i < u8.length; i++) {
    expect(u8.at(i)).toBe(97 + i);
  }
});
