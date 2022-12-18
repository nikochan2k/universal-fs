import u8h from "../../handlers/uint8array";

it("empty", async () => {
  const actual = await u8h.empty();
  expect(actual instanceof Uint8Array).toBe(true);
  expect(actual.byteLength).toBe(0);
});

it("isEmpty", async () => {
  const empty = new Uint8Array(0);
  const notEmpty = new Uint8Array(2);
  let actual: boolean;
  actual = await u8h.isEmpty(empty);
  expect(actual).toBe(true);
  actual = await u8h.isEmpty(notEmpty);
  expect(actual).toBe(false);
});

it("merge", async () => {
  const chunk0 = new Uint8Array(0);
  const chunk1 = new Uint8Array(1);
  const chunk2 = new Uint8Array(2);
  let actual: Uint8Array;
  actual = await u8h.merge([]);
  expect(actual.byteLength).toBe(0);
  actual = await u8h.merge([chunk0]);
  expect(actual.byteLength).toBe(0);
  actual = await u8h.merge([chunk1]);
  expect(actual.byteLength).toBe(1);
  actual = await u8h.merge([chunk1, chunk2]);
  expect(actual.byteLength).toBe(3);
});

it("size", async () => {
  const chunk0 = new Uint8Array(0);
  const chunk1 = new Uint8Array(1);
  let actual: number;
  actual = await u8h.size(chunk0);
  expect(actual).toBe(0);
  actual = await u8h.size(chunk1);
  expect(actual).toBe(1);
});

it("slice", async () => {
  const notEmpty = new Uint8Array(3);
  let actual: Uint8Array;
  actual = await u8h.slice(notEmpty, { length: 0 });
  expect(actual.byteLength).toBe(0);
  actual = await u8h.slice(notEmpty, { length: 1 });
  expect(actual.byteLength).toBe(1);
  actual = await u8h.slice(notEmpty, { start: 1 });
  expect(actual.byteLength).toBe(2);
  actual = await u8h.slice(notEmpty, { start: 1, length: 1 });
  expect(actual.byteLength).toBe(1);
  actual = await u8h.slice(notEmpty, { start: 1, length: 3 });
  expect(actual.byteLength).toBe(2);
  actual = await u8h.slice(notEmpty, { start: 3 });
  expect(actual.byteLength).toBe(0);
});
