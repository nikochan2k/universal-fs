import b64h from "../../handlers/base64";

it("empty", async () => {
  const actual = await b64h.empty();
  expect(typeof actual === "string").toBe(true);
  expect(actual.length).toBe(0);
});

it("isEmpty", async () => {
  const empty = "";
  const notEmpty = "Zm9v";
  let actual: boolean;
  actual = await b64h.isEmpty(empty);
  expect(actual).toBe(true);
  actual = await b64h.isEmpty(notEmpty);
  expect(actual).toBe(false);
});

it("merge", async () => {
  const chunk0 = "";
  const chunk1 = "Zm9v";
  const chunk2 = "Zm9vYmFy";
  let actual: string;
  actual = await b64h.merge([]);
  expect(actual).toBe("");
  actual = await b64h.merge([chunk0]);
  expect(actual).toBe("");
  actual = await b64h.merge([chunk1]);
  expect(actual).toBe("Zm9v");
  actual = await b64h.merge([chunk1, chunk2]);
  expect(actual).toBe("Zm9vZm9vYmFy");
});

it("size", async () => {
  const chunk0 = "";
  const chunk1 = "Zm9vYmFy";
  let actual: number;
  actual = await b64h.size(chunk0);
  expect(actual).toBe(0);
  actual = await b64h.size(chunk1);
  expect(actual).toBe(6);
});

it("slice", async () => {
  const notEmpty = "Zm9vYmFy";
  let actual: string;
  actual = await b64h.slice(notEmpty, { length: 0 });
  expect(actual).toBe("");
  actual = await b64h.slice(notEmpty, { length: 1 });
  expect(actual).toBe("Zg==");
  actual = await b64h.slice(notEmpty, { start: 1 });
  expect(actual).toBe("b29iYXI=");
  actual = await b64h.slice(notEmpty, { start: 1, length: 1 });
  expect(actual).toBe("bw==");
  actual = await b64h.slice(notEmpty, { start: 4, length: 3 });
  expect(actual).toBe("YXI=");
  actual = await b64h.slice(notEmpty, { start: 6 });
  expect(actual).toBe("");
});
