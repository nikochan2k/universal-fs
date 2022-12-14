import b2u from "../../../converters/binary/uint8array.js";

it("convert", async () => {
  const src = "abc";
  const actual = await b2u.convert(src, { srcType: "binary" });
  expect(actual.length).toEqual(3);
  for (let i = 0; i < actual.length; i++) {
    expect(actual.at(i)).toBe(97 + i);
  }
});
