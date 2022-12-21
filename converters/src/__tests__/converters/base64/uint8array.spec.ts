import b2u from "../../../converters/base64/uint8array";

it("convert", async () => {
  const src = "YWJj";
  const actual = await b2u.convert(src, { srcType: "base64" });
  expect(actual.length).toEqual(3);
  for (let i = 0; i < actual.length; i++) {
    expect(actual.at(i)).toBe(97 + i);
  }
});
