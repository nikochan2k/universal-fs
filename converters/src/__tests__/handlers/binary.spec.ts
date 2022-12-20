import bh from "../../handlers/binary";

it("empty", async () => {
  const actual = await bh.empty();
  expect(typeof actual === "string").toBe(true);
  expect(actual.length).toBe(0);
});

it("isEmpty", async () => {
  const empty = "";
  const notEmpty = "abcd";
  let actual: boolean;
  actual = await bh.isEmpty(empty);
  expect(actual).toBe(true);
  actual = await bh.isEmpty(notEmpty);
  expect(actual).toBe(false);
});

it("merge", async () => {
  const chunk0 = "";
  const chunk1 = "abcd";
  const chunk2 = "abcdefgh";
  let actual: string;
  actual = await bh.merge([]);
  expect(actual).toBe("");
  actual = await bh.merge([chunk0]);
  expect(actual).toBe("");
  actual = await bh.merge([chunk1]);
  expect(actual).toBe("abcd");
  actual = await bh.merge([chunk1, chunk2]);
  expect(actual).toBe("abcdabcdefgh");
});

it("size", async () => {
  const chunk0 = "";
  const chunk1 = "abcdefgh";
  let actual: number;
  actual = await bh.size(chunk0);
  expect(actual).toBe(0);
  actual = await bh.size(chunk1);
  expect(actual).toBe(8);
});

it("slice", async () => {
  const notEmpty = "abcdefgh";
  let actual: string;
  actual = await bh.slice(notEmpty, { length: 0 });
  expect(actual).toBe("");
  actual = await bh.slice(notEmpty, { length: 1 });
  expect(actual).toBe("a");
  actual = await bh.slice(notEmpty, { start: 1 });
  expect(actual).toBe("bcdefgh");
  actual = await bh.slice(notEmpty, { start: 1, length: 1 });
  expect(actual).toBe("b");
  actual = await bh.slice(notEmpty, { start: 6, length: 3 });
  expect(actual).toBe("gh");
  actual = await bh.slice(notEmpty, { start: 8 });
  expect(actual).toBe("");
});
