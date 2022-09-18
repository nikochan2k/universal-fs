import { EMPTY_ARRAY_BUFFER } from "univ-conv";
import {
  AbstractDirectory,
  EntryType,
  Item,
  joinPaths,
  NotFoundError,
} from "univ-fs";
import { AzureFileSystem } from "./AzureFileSystem";

export class AzureDirectory extends AbstractDirectory {
  constructor(private afs: AzureFileSystem, path: string) {
    super(afs, path);
  }

  public async _doDelete(): Promise<void> {
    const afs = this.afs;
    const path = this.path;

    try {
      const client = afs._getBlockBlobClient(path, true);
      await client.delete();
    } catch (e) {
      throw afs._error(path, e, true);
    }
  }

  public async _doList(): Promise<Item[]> {
    const afs = this.afs;
    const path = this.path;
    const items: Item[] = [];
    try {
      const list = afs.containerClient.listBlobsByHierarchy("/", {
        prefix: afs._getBlobName(path, true),
      });
      for await (const v of list) {
        if (v.kind === "prefix") {
          const parts = v.name.split("/");
          const name = parts[parts.length - 2] as string;
          const path = joinPaths(this.path, name);
          items.push({ path, type: EntryType.Directory });
        } else {
          const parts = v.name.split("/");
          const name = parts[parts.length - 1] as string;
          const path = joinPaths(this.path, name);
          items.push({ path, type: EntryType.File });
        }
      }
      return items;
    } catch (e) {
      const err = afs._error(path, e, false);
      if (err.name === NotFoundError.name) {
        return items;
      }
      throw err;
    }
  }

  public async _doMkcol(): Promise<void> {
    const afs = this.afs;
    const path = this.path;

    try {
      const client = afs._getBlockBlobClient(path, true);
      await client.uploadData(EMPTY_ARRAY_BUFFER);
    } catch (e) {
      throw afs._error(path, e, true);
    }
  }
}
