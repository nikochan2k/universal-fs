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

it("size", async () => {
  const chunk0 = new ArrayBuffer(0);
  const chunk1 = new ArrayBuffer(1);
  let actual: number;
  actual = await ab.size(chunk0);
  expect(actual).toBe(0);
  actual = await ab.size(chunk1);
  expect(actual).toBe(1);
});

it("slice", async () => {
  const notEmpty = new ArrayBuffer(3);
  let actual: ArrayBuffer;
  actual = await ab.slice(notEmpty, { length: 0 });
  expect(actual.byteLength).toBe(0);
  actual = await ab.slice(notEmpty, { length: 1 });
  expect(actual.byteLength).toBe(1);
  actual = await ab.slice(notEmpty, { start: 1 });
  expect(actual.byteLength).toBe(2);
  actual = await ab.slice(notEmpty, { start: 1, length: 1 });
  expect(actual.byteLength).toBe(1);
  actual = await ab.slice(notEmpty, { start: 1, length: 3 });
  expect(actual.byteLength).toBe(2);
  actual = await ab.slice(notEmpty, { start: 3 });
  expect(actual.byteLength).toBe(0);
});
