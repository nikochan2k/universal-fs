import a2b from "../../../converters/arraybuffer/blob.js";

it("convert", async () => {
  const u8 = new Uint8Array([97, 98, 99]);
  const src = u8.buffer;
  const actual = await a2b.convert(src);
  expect(actual.size).toEqual(3);
  const ab = await actual.arrayBuffer();
  const actualU8 = new Uint8Array(ab);
  for (let i = 0; i < src.byteLength; i++) {
    expect(actualU8.at(i)).toBe(u8.at(i));
  }
});
