import bh from "../../handlers/blob";

it("empty", async () => {
  const actual = await bh.empty();
  expect(actual instanceof Blob).toBe(true);
  expect(actual.length).toBe(0);
});

it("isEmpty", async () => {
  const empty = new Blob([]);
  const notEmpty = new Blob(["ab"]);
  let actual: boolean;
  actual = await bh.isEmpty(empty);
  expect(actual).toBe(true);
  actual = await bh.isEmpty(notEmpty);
  expect(actual).toBe(false);
});

it("merge", async () => {
  const chunk0 = new Blob([""]);
  const chunk1 = new Blob(["a"]);
  const chunk2 = new Blob(["bc"]);
  let actual: Blob;
  actual = await bh.merge([]);
  expect(actual.length).toBe(0);
  actual = await bh.merge([chunk0]);
  expect(actual.length).toBe(0);
  actual = await bh.merge([chunk1]);
  expect(actual.length).toBe(1);
  actual = await bh.merge([chunk1, chunk2]);
  expect(actual.length).toBe(3);
});

it("size", async () => {
  const chunk0 = new Blob([""]);
  const chunk1 = new Blob(["a"]);
  let actual: number;
  actual = await bh.size(chunk0);
  expect(actual).toBe(0);
  actual = await bh.size(chunk1);
  expect(actual).toBe(1);
});

it("slice", async () => {
  const notEmpty = new Blob(["abc"]);
  let actual: Blob;
  actual = await bh.slice(notEmpty, { length: 0 });
  expect(actual.length).toBe(0);
  actual = await bh.slice(notEmpty, { length: 1 });
  expect(actual.length).toBe(1);
  actual = await bh.slice(notEmpty, { start: 1 });
  expect(actual.length).toBe(2);
  actual = await bh.slice(notEmpty, { start: 1, length: 1 });
  expect(actual.length).toBe(1);
  actual = await bh.slice(notEmpty, { start: 1, length: 3 });
  expect(actual.length).toBe(2);
  actual = await bh.slice(notEmpty, { start: 3 });
  expect(actual.length).toBe(0);
});
