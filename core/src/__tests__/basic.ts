import { DEFAULT_CONVERTER } from "univ-conv";
import { File, FileSystem, ExistsAction, NoParentAction } from "../core";
import { ErrorLike, NotFoundError } from "../errors";

const c = DEFAULT_CONVERTER;

export const testAll = (
  fs: FileSystem,
  options?: {
    setup?: () => Promise<void>;
    teardown?: () => Promise<void>;
  }
) => {
  it("setup", async () => {
    if (options?.setup) {
      await options.setup();
    }
  });

  it("rootdir", async () => {
    const dir = fs.getDirectory("/");
    const paths = await dir.readdir();
    expect(paths.length).toBe(0);
  });

  it("add empty file", async () => {
    const file = fs.getFile("/empty.txt");
    try {
      await file.stat();
      throw new Error("Found file: " + file.path);
    } catch (e) {
      expect((e as ErrorLike).name).toBe(NotFoundError.name);
    }
    const buffer = await c.toArrayBuffer("");
    await file.write(buffer);
    const stats = await file.stat();
    expect(stats.size).toBe(0);
  });

  it("add text file", async () => {
    const file = fs.getFile("/test.txt");
    try {
      await file.stat();
      throw new Error("Found file: " + file.path);
    } catch (e) {
      expect((e as ErrorLike).name).toBe(NotFoundError.name);
    }
    const buffer = await c.toArrayBuffer("test");
    await file.write(buffer);
    const stats = await file.stat();
    expect(stats.size).toBe(4);
  });

  it("read text file", async () => {
    const file = fs.getFile("/test.txt");
    const buffer = await file.read("uint8array");
    expect(buffer.byteLength).toBe(4);
    const text = await c.toText(buffer!);
    expect(text).toBe("test");
  });

  it("continuous read and write", async () => {
    const file = fs.getFile("/otani.txt");
    await file.write("大谷翔平");
    let text = await file.read("text");
    expect(text).toBe("大谷翔平");

    await file.write("ホームラン", {
      append: true,
      onExists: ExistsAction.Overwrite,
    });
    text = await file.read("text");
    expect(text).toBe("大谷翔平ホームラン");
  });

  it("listdir test", async () => {
    const dir = fs.getDirectory("/");
    let dirs = await dir.readdir();
    expect(0 <= dirs.indexOf("/empty.txt")).toBe(true);
    expect(0 <= dirs.indexOf("/test.txt")).toBe(true);
    expect(0 <= dirs.indexOf("/otani.txt")).toBe(true);
  });

  it("mkdir test", async () => {
    const folder = fs.getDirectory("/folder");
    try {
      const stats = await folder.stat();
      if (stats.size != null) {
        throw new Error("Found file: " + folder.path);
      }
    } catch (e) {
      expect((e as ErrorLike).name).toBe(NotFoundError.name);
    }

    await folder.mkdir();
    try {
      const stats = await folder.stat();
      expect(stats).not.toBe(null);
      if (stats.size != null) {
        throw new Error("File has created: " + folder.path);
      }
    } catch (e) {
      expect((e as ErrorLike).name).toBe(NotFoundError.name);
    }
  });

  it("create file in dir", async () => {
    let file = fs.getFile("/folder/sample.txt");
    file = file as File;
    try {
      await file.stat();
      throw new Error("Found file: " + file.path);
    } catch (e) {
      expect((e as ErrorLike).name).toBe(NotFoundError.name);
    }
    const before = Math.floor(Date.now() / 1000);
    await file.write("Sample");
    const after = Math.floor(Date.now() + 1 / 1000);
    const stats = await file.stat();
    const modified = Math.floor((stats.modified ?? 0) / 1000);
    expect(modified).toBeGreaterThanOrEqual(before);
    expect(modified).toBeLessThan(after);
    const text = await file.read("text");
    expect(text).toBe("Sample");

    const dir = fs.getDirectory("/folder/");
    const list = await dir.list();
    expect(0 <= list.indexOf("/folder/sample.txt")).toBe(true);
  });

  it("copy directory", async () => {
    const from = fs.getDirectory("/folder");
    const to = fs.getDirectory("/folder2");
    await from.copy(to, {
      onExists: ExistsAction.Overwrite,
      onNoParent: NoParentAction.Error,
      recursive: true,
    });
    const stats = await to.stat();
    expect(stats.size).toBeUndefined();
    if (fs.supportDirectory()) {
      const root = fs.getDirectory("/");
      const list = await root.ls();
      expect(0 <= list.indexOf("/folder2")).toBe(true);
    }
    const toList = await to.ls();
    expect(0 <= toList.indexOf("/folder2/sample.txt")).toBe(true);
  });

  it("move file", async () => {
    await fs.move("/folder2/sample.txt", "/folder2/sample2.txt", {
      onExists: ExistsAction.Overwrite,
      onNoParent: NoParentAction.Error,
    });
    const list = await fs.list("/folder2");
    expect(list.indexOf("/folder2/sample.txt") < 0).toBe(true);
    expect(0 <= list.indexOf("/folder2/sample2.txt")).toBe(true);
  });

  it("move directory", async () => {
    await fs.move("/folder2", "/folder3", {
      onExists: ExistsAction.Overwrite,
      onNoParent: NoParentAction.Error,
    });
    if (fs.supportDirectory()) {
      const root = fs.getDirectory("/");
      const list = await root.ls();
      expect(list.indexOf("/folder2") < 0).toBe(true);
      expect(0 <= list.indexOf("/folder3")).toBe(true);
    }
    const folder3 = fs.getDirectory("/folder3");
    const folder3List = await folder3.ls();
    expect(0 <= folder3List.indexOf("/folder3/sample2.txt")).toBe(true);
  });

  it("teardown", async () => {
    if (options?.teardown) {
      await options.teardown();
    }
  });
};
