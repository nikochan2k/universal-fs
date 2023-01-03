import { FileSystem } from "../core.js";
import { ErrorLike, NotFoundError } from "../errors";

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
    const stat = await fs.head("/");
    expect(stat.size).toBeUndefined();
  });

  it("nothing", async () => {
    try {
      await fs.stat("/nothing");
      throw new Error("/nothing exists");
    } catch (e) {
      expect((e as ErrorLike).name).toBe(NotFoundError.name);
    }
  });

  it("file_head", async () => {
    await fs.write("/file_head", new ArrayBuffer(1));
    const stat = await fs.stat("/file_head");
    expect(stat.size).toBe(1);
  });

  it("teardown", async () => {
    if (options?.teardown) {
      await options.teardown();
    }
  });
};
