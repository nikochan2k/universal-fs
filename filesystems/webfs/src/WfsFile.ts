import { ConvertOptions, Data, handleReadableStream } from "univ-conv";
import {
  AbortError,
  AbstractFile,
  ErrorLike,
  joinPaths,
  NoModificationAllowedError,
  Stats,
  WriteOptions,
} from "univ-fs";
import { WfsFileSystem } from "./WfsFileSystem";

export class WfsFile extends AbstractFile {
  constructor(public wfs: WfsFileSystem, path: string) {
    super(wfs, path);
  }

  public async _doDelete(): Promise<void> {
    const wfs = this.wfs;
    const path = this.path;
    const repository = wfs.repository;
    const fullPath = joinPaths(repository, path);

    const fs = await wfs._getFS();
    return await new Promise<void>((resolve, reject) => {
      fs.root.getFile(
        fullPath,
        { create: false },
        (entry) => entry.remove(resolve, (e) => reject(e)),
        (e) => reject(e)
      );
    });
  }

  public async _doRead(): Promise<Data> {
    const wfs = this.wfs;
    const repository = wfs.repository;
    const path = this.path;
    const fullPath = joinPaths(repository, path);

    const fs = await wfs._getFS();
    return await new Promise<File>((resolve, reject) => {
      const onError = (e: unknown) => reject(e);
      fs.root.getFile(
        fullPath,
        { create: false },
        (entry) => entry.file((file) => resolve(file), onError),
        onError
      );
    });
  }

  public async _doWrite(
    data: Data,
    _stats: Stats,
    options: WriteOptions
  ): Promise<void> {
    const repository = this.fs.repository;
    const path = this.path;
    const fullPath = joinPaths(repository, path);

    const conv = await this._getConverter();
    const co: Partial<ConvertOptions> = { ...options };
    delete co.start;
    const stream = await conv.convert("readablestream", data, co);

    const fs = await this.wfs._getFS();
    const writer = await new Promise<FileWriter>((resolve, reject) => {
      const onError = (e: unknown) => reject(e);
      fs.root.getFile(
        fullPath,
        { create: true },
        (entry) =>
          entry.createWriter((w) => {
            void (async () => {
              if (typeof options.start === "number") {
                w.seek(options.start);
                resolve(w);
              } else if (options.append) {
                const stats = await this.head(options);
                const size = stats.size as number;
                w.seek(size);
                resolve(w);
              } else {
                this._handle(w, resolve, reject);
                w.truncate(0);
              }
            })();
          }, onError),
        onError
      );
    });

    await handleReadableStream(stream, async (chunk) => {
      const blob = await conv.convert("blob", chunk);
      await new Promise((resolve, reject) => {
        this._handle(writer, resolve, reject);
        writer.write(blob);
      });
      return true;
    });
  }

  public supportAppend(): boolean {
    return true;
  }

  public supportRangeRead(): boolean {
    return false;
  }

  public supportRangeWrite(): boolean {
    return true;
  }

  private _handle(
    writer: FileWriter,
    resolve: (value: FileWriter | PromiseLike<FileWriter>) => void,
    reject: (reason?: ErrorLike) => void
  ) {
    const path = this.path;
    const removeEvents = () => {
      writer.removeEventListener("abort", null);
      writer.removeEventListener("error", null);
      writer.removeEventListener("writeend", null);
    };
    writer.addEventListener("abort", (e: unknown) => {
      reject(
        this.fs._createError({
          ...AbortError,
          path,
          e,
        })
      );
      removeEvents();
    });
    writer.addEventListener("error", (e: unknown) => {
      reject(
        this.fs._createError({
          ...NoModificationAllowedError,
          path,
          e,
        })
      );
      removeEvents();
    });
    writer.addEventListener("writeend", () => {
      resolve(writer);
      removeEvents();
    });
  }
}
