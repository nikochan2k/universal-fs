import { getName, getParentPath, normalizePath } from "../util";

it("util/path.ts#getParentPath", () => {
  let parentPath = getParentPath("/hoge/fuga");
  expect(parentPath).toBe("/hoge");
  parentPath = getParentPath("/hoge/fuga/");
  expect(parentPath).toBe("/hoge");
  parentPath = getParentPath("/");
  expect(parentPath).toBe("/");
  parentPath = getParentPath("hoge");
  expect(parentPath).toBe("/");
  parentPath = getParentPath("");
  expect(parentPath).toBe("/");
});

it("util/path.ts#getName", () => {
  let name = getName("/hoge/fuga");
  expect(name).toBe("fuga");
  name = getName("hoge/fuga");
  expect(name).toBe("fuga");
  name = getName("/hoge/fuga/");
  expect(name).toBe("fuga");
  name = getName("/");
  expect(name).toBe("");
  name = getName("test");
  expect(name).toBe("test");
});

it("util/path.ts#normalizePath", () => {
  let path = normalizePath("/hoge/fuga");
  expect(path).toBe("/hoge/fuga");
  path = normalizePath("/hoge//fuga/");
  expect(path).toBe("/hoge/fuga");
  path = normalizePath("/hoge/fuga/");
  expect(path).toBe("/hoge/fuga");
  path = normalizePath("./hoge/fuga/");
  expect(path).toBe("/hoge/fuga");
  path = normalizePath("/hoge/../fuga/");
  expect(path).toBe("/fuga");
  path = normalizePath("/");
  expect(path).toBe("/");
  path = normalizePath("");
  expect(path).toBe("/");
});
