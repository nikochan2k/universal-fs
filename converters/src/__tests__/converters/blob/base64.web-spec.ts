import b2b from "../../../converters/blob/base64.js";

it("convert", async () => {
  const u8 = new Uint8Array([97, 98, 99]);
  const src = new Blob([u8]);
  const actual = await b2b.convert(src);
  expect(actual).toBe("YWJj");
});
