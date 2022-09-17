import { AbstractDirectory, EntryType, Item, joinPaths } from "univ-fs";
import { GCSFileSystem } from "./GCSFileSystem";

export class GCSDirectory extends AbstractDirectory {
  constructor(private gfs: GCSFileSystem, path: string) {
    super(gfs, path);
  }

  public async _doList(): Promise<Item[]> {
    const gfs = this.gfs;
    const items: Item[] = [];
    try {
      const prefix = gfs._getFullPath(this.path, true);
      const bucket = gfs._getBucket();
      // eslint-disable-next-line
      const [files, , apiResponse] = await bucket.getFiles({
        autoPaginate: false,
        prefix,
        delimiter: "/",
      });
      const prefixes = (apiResponse?.prefixes ?? []) as string[]; // eslint-disable-line
      for (const dir of prefixes) {
        if (prefix === dir) {
          continue;
        }
        const parts = dir.split("/");
        const name = parts[parts.length - 2] as string;
        const path = joinPaths(this.path, name);
        items.push({ path, type: EntryType.Directory });
      }
      for (const file of files ?? []) {
        if (prefix === file.name) {
          continue;
        }
        const parts = file.name.split("/");
        const name = parts[parts.length - 1] as string;
        const path = joinPaths(this.path, name);
        items.push({ path, type: EntryType.File });
      }
      return items;
    } catch (e) {
      throw gfs._error(this.path, e, false);
    }
  }

  public _doMkcol(): Promise<void> {
    return Promise.resolve();
  }

  public _doDelete(): Promise<void> {
    return Promise.resolve();
  }
}
