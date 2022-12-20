import a2b from "../../../converters/uint8array/base64";

it("convert", async () => {
  const u8 = new Uint8Array([97, 98, 99]);
  const actual = await a2b.convert(u8);
  expect(actual).toBe("YWJj");
});
