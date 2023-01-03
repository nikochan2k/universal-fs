import b2b from "../../../converters/base64/binary.js";

it("convert", async () => {
  const src = "YWJj";
  const actual = await b2b.convert(src, { srcType: "base64" });
  expect(actual).toBe("abc");
});
