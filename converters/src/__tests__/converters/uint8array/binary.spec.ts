import u2b from "../../../converters/uint8array/binary";

it("convert", async () => {
  const u8 = new Uint8Array([97, 98, 99]);
  const actual = await u2b.convert(u8);
  expect(actual).toBe("abc");
});
