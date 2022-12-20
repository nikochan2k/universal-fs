import a2b from "../../../converters/arraybuffer/binary";

it("convert", async () => {
  const u8 = new Uint8Array([97, 98, 99]);
  const ab = u8.buffer;
  const actual = await a2b.convert(ab);
  expect(actual).toBe("abc");
});
