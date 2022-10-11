import { Data, hasReadable } from "univ-conv";
import { AbstractFile, Stats, WriteOptions } from "univ-fs";
import { GCSFileSystem } from "./GCSFileSystem";

export class GCSFile extends AbstractFile {
  constructor(private gfs: GCSFileSystem, path: string) {
    super(gfs, path);
  }

  public async _doDelete(): Promise<void> {
    const gfs = this.gfs;
    const path = this.path;
    try {
      const file = this.gfs._getEntry(path, false);
      await file.delete();
    } catch (e) {
      throw gfs._error(path, e, true);
    }
  }

  public async _doRead(): Promise<Data> {
    const gfs = this.gfs;
    const path = this.path;
    try {
      const file = gfs._getEntry(path, false);
      if (hasReadable) {
        return file.createReadStream();
      } else {
        const res = await file.download();
        return res[0];
      }
    } catch (e) {
      throw gfs._error(path, e, false);
    }
  }

  public async _doWrite(
    data: Data,
    _stats: Stats | undefined,
    options: WriteOptions
  ): Promise<void> {
    const gfs = this.gfs;
    const path = this.path;
    const file = this.gfs._getEntry(path, false);

    try {
      const conv = await this._getConverter();
      if (conv.is("readable", data)) {
        const readable = data;
        const writable = file.createWriteStream();
        await conv.pipe(readable, writable, options);
      } else {
        const buffer = (await conv.convert("uint8array", data)) as Buffer;
        await file.save(buffer);
      }
    } catch (e) {
      throw gfs._error(path, e, true);
    }
  }

  public supportAppend(): boolean {
    return false;
  }

  public supportRangeRead(): boolean {
    return false;
  }

  public supportRangeWrite(): boolean {
    return false;
  }
}
