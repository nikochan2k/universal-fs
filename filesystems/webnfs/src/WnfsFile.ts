import { ConvertOptions, Data } from "univ-conv";
import { AbstractFile, ReadOptions, Stats, WriteOptions } from "univ-fs";
import { WnfsFileSystem } from "./WnfsFileSystem";

export class WnfsFile extends AbstractFile {
  constructor(public wfs: WnfsFileSystem, path: string) {
    super(wfs, path);
  }

  public async _doDelete(): Promise<void> {
    const { parent, name } = await this.wfs._getParent(this.path);
    await parent.removeEntry(name);
  }

  // eslint-disable-next-line
  public async _doRead(_stats: Stats, _options: ReadOptions): Promise<Data> {
    const { parent, name } = await this.wfs._getParent(this.path);
    const fileHandle = await parent.getFileHandle(name);
    return await fileHandle.getFile();
  }

  public async _doWrite(
    data: Data,
    stats: Stats,
    options: WriteOptions
  ): Promise<void> {
    const { parent, name } = await this.wfs._getParent(this.path);
    const fileHandle = await parent.getFileHandle(name, {
      create: stats == null,
    });
    const writable = await fileHandle.createWritable({
      keepExistingData: options.append,
    });
    if (options.append) {
      const stats = await this.head(options);
      await writable.seek(stats.size as number);
    }

    const conv = await this._getConverter();
    const co: Partial<ConvertOptions> = { ...options };
    delete co.start;
    const readable = await conv.convert("readablestream", data, co);
    await conv.pipe(readable, writable);
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
}
