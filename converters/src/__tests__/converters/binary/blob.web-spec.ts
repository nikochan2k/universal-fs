import b2b from "../../../converters/binary/blob.js";

it("convert", async () => {
  const src = "abc";
  const actual = await b2b.convert(src, { srcType: "binary" });
  expect(actual.length).toEqual(3);
  const ab = await actual.arrayBuffer();
  const actualU8 = new Uint8Array(ab);
  for (let i = 0; i < actual.length; i++) {
    expect(actualU8.at(i)).toBe(97 + i);
  }
});
