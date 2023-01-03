import b2b from "../../../converters/binary/base64.js";

it("convert", async () => {
  const src = "abc";
  const actual = await b2b.convert(src, { srcType: "binary" });
  expect(actual).toBe("YWJj");
});
