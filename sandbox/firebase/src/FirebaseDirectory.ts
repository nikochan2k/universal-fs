import { listAll } from "@firebase/storage";
import { AbstractDirectory, EntryType, Item, joinPaths } from "univ-fs";
import { FirebaseFileSystem } from "./FirebaseFileSystem";

export class FirebaseDirectory extends AbstractDirectory {
  constructor(private ffs: FirebaseFileSystem, path: string) {
    super(ffs, path);
  }

  public async _doDelete(): Promise<void> {
    return Promise.resolve();
  }

  public async _doList(): Promise<Item[]> {
    const ffs = this.ffs;
    const path = this.path;
    const items: Item[] = [];
    try {
      /* eslint-disable */
      const dir = await ffs._getEntry(path, true);
      const prefix = ffs._getKey(path, true);
      const result = await listAll(dir);
      for (const dir of result.prefixes || []) {
        if (prefix === dir.fullPath) {
          continue;
        }

        const parts = dir.fullPath.split("/");
        const name = parts[parts.length - 1] as string;
        const joined = joinPaths(this.path, name);
        items.push({ path: joined, type: EntryType.Directory });
      }
      for (const file of result.items ?? []) {
        if (prefix === file.fullPath) {
          continue;
        }
        const parts = file.fullPath.split("/");
        const name = parts[parts.length - 1] as string;
        const joined = joinPaths(path, name);
        items.push({ path: joined, type: EntryType.File });
      }
      return items;
      /* eslint-enable */
    } catch (e) {
      throw ffs._error(path, e, false);
    }
  }

  public async _doMkcol(): Promise<void> {
    return Promise.resolve();
  }
}
