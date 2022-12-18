import ab from "../../handlers/arraybuffer";

it("empty", async () => {
  const actual = await ab.empty();
  expect(actual instanceof ArrayBuffer).toBe(true);
  expect(actual.byteLength).toBe(0);
});
