import ab from "../../handlers/arraybuffer";

it("empty", async () => {
  const actual = await ab.empty();
  expect(actual instanceof ArrayBuffer).toBe(true);
  expect(actual.byteLength).toBe(0);
});

it("isEmpty", async () => {
  const empty = new ArrayBuffer(0);
  const notEmpty = new ArrayBuffer(2);
  let actual: boolean;
  actual = await ab.isEmpty(empty);
  expect(actual).toBe(true);
  actual = await ab.isEmpty(notEmpty);
  expect(actual).toBe(false);
  actual = await ab.isEmpty(notEmpty, { length: 0 });
  expect(actual).toBe(true);
  actual = await ab.isEmpty(notEmpty, { length: 1 });
  expect(actual).toBe(false);
  actual = await ab.isEmpty(notEmpty, { start: 1 });
  expect(actual).toBe(false);
  actual = await ab.isEmpty(notEmpty, { start: 1, length: 2 });
  expect(actual).toBe(false);
  actual = await ab.isEmpty(notEmpty, { start: 2 });
  expect(actual).toBe(true);
});

it("merge", async () => {
  const chunk0 = new ArrayBuffer(0);
  const chunk1 = new ArrayBuffer(1);
  const chunk2 = new ArrayBuffer(2);
  let actual: ArrayBuffer;
  actual = await ab.merge([]);
  expect(actual.byteLength).toBe(0);
  actual = await ab.merge([chunk0]);
  expect(actual.byteLength).toBe(0);
  actual = await ab.merge([chunk1]);
  expect(actual.byteLength).toBe(1);
  actual = await ab.merge([chunk1, chunk2]);
  expect(actual.byteLength).toBe(3);
});

it("pipe", async () => {
  // todo
});

it("size", async () => {
  // todo
});
