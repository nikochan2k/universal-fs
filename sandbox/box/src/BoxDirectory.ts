import {
  AbstractDirectory,
  EntryType,
  getName,
  getParentPath,
  Item,
} from "univ-fs";
import { BoxFileSystem, EntryInfo } from "./BoxFileSystem";

export class BoxDirectory extends AbstractDirectory {
  constructor(private bfs: BoxFileSystem, path: string) {
    super(bfs, path);
  }

  public async _doList(): Promise<Item[]> {
    const bfs = this.bfs;
    const path = this.path;
    try {
      const fullPath = bfs._getFullPath(path);
      const info = await bfs._getInfoFromFullPath(fullPath, path);
      const client = await bfs._getClient();
      const result = await client.folders.getItems(info.id, {
        fields: "name,created_at,modified_at,etag",
      });
      const items: Item[] = [];
      for (const e of result.entries as EntryInfo[]) {
        const item: Item = { path: (path === "/" ? "/" : path + "/") + e.name };
        const createdDate = new Date(e.created_at as string);
        const created = createdDate.getTime();
        if (!isNaN(created)) {
          item.created = created;
        }
        const modifiedDate = new Date(e.modified_at as string);
        const modified = modifiedDate.getTime();
        if (!isNaN(modified)) {
          item.modified = modified;
        }
        item.etag = e.etag as string;
        if (e.type === "file") {
          item.type = EntryType.File;
          item.size = e.size as number;
        } else {
          item.type = EntryType.Directory;
        }
        items.push(item);
      }
      return items;
    } catch (e) {
      throw bfs._error(path, e, true);
    }
  }

  public async _doMkcol(): Promise<void> {
    const bfs = this.bfs;
    const path = this.path;
    try {
      const fullPath = bfs._getFullPath(path);
      const parentPath = getParentPath(fullPath);
      const name = getName(fullPath);
      const info = await bfs._getInfoFromFullPath(parentPath, path);
      const client = await bfs._getClient();
      await client.folders.create(info.id, name);
    } catch (e) {
      if ((e as any).statusCode !== 409) {
        throw bfs._error(path, e, true);
      }
    }
  }

  public async _doDelete(): Promise<void> {
    const bfs = this.bfs;
    const path = this.path;
    try {
      const client = await bfs._getClient();
      const info = await bfs._getInfo(path);
      await client.folders.delete(info.id, { recursive: false });
    } catch (e) {
      throw bfs._error(path, e, true);
    }
  }
}
