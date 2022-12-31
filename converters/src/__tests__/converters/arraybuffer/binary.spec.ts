import a2b from "../../../converters/arraybuffer/binary";

it("convert", async () => {
  const u8 = new Uint8Array([97, 98, 99]);
  const src = u8.buffer;
  const actual = await a2b.convert(src);
  expect(actual).toBe("abc");
});
