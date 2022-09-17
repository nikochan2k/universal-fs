import { FileSystem } from "../core";
import { ErrorLike, NotFoundError, TypeMismatchError } from "../errors";

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
    const list = await fs.list("/");
    expect(list.length).toBe(0);
  });

  it("nothing", async () => {
    try {
      const list = await fs.list("/nothing");
      if (0 < list.length) {
        throw new Error("/nothing exists");
      }
    } catch (e) {
      expect((e as ErrorLike).name).toBe(NotFoundError.name);
    }
  });

  it("file_list", async () => {
    await fs.write("/file_list", new ArrayBuffer(1));
    try {
      const list = await fs.list("/file_list");
      if (0 < list.length) {
        throw new Error("/nothing exists");
      }
    } catch (e) {
      expect(
        (e as ErrorLike).name === TypeMismatchError.name ||
          (e as ErrorLike).name === NotFoundError.name
      ).toBe(true);
    }
  });

  it("teardown", async () => {
    if (options?.teardown) {
      await options.teardown();
    }
  });
};
