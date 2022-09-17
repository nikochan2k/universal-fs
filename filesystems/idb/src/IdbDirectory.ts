import { AbstractDirectory, Item } from "univ-fs";
import { ENTRY_STORE, IdbFileSystem } from "./IdbFileSystem";

const DIR_OPEN_BOUND = String.fromCharCode("/".charCodeAt(0) + 1);

function countSlash(path: string) {
  let result = 0;
  for (let i = 0, end = path.length; i < end; i++) {
    if (path[i] === "/") {
      result++;
    }
  }
  return result;
}

function getRange(fullPath: string) {
  if (fullPath === "/") {
    return IDBKeyRange.bound("/", DIR_OPEN_BOUND, false, true);
  } else {
    return IDBKeyRange.bound(
      fullPath + "/",
      fullPath + DIR_OPEN_BOUND,
      false,
      true
    );
  }
}
export class IdbDirectory extends AbstractDirectory {
  constructor(private idbFS: IdbFileSystem, path: string) {
    super(idbFS, path);
  }

  public async _doDelete(): Promise<void> {
    await this.idbFS._doDelete(this.path);
  }

  public async _doList(): Promise<Item[]> {
    const path = this.path;
    const idbFS = this.idbFS;
    const db = await idbFS._open();
    return await new Promise<Item[]>((resolve, reject) => {
      const items: Item[] = [];
      const entryStore = idbFS._getObjectStore(db, ENTRY_STORE, "readonly");

      let slashCount: number;
      if (path === "/") {
        slashCount = 1;
      } else {
        slashCount = countSlash("/") + 1; // + 1 is the last slash for directory
      }

      const range = getRange(path);
      if (typeof entryStore.getAllKeys === "function") {
        const request = entryStore.getAllKeys(range);
        request.onsuccess = (ev) => {
          const keys = (ev.target as IDBRequest).result as string[];
          for (const key of keys) {
            if (
              path !== key && // remove root dir
              slashCount === countSlash(key)
            ) {
              items.push({ path: key });
            }
          }
          resolve(items);
        };
        request.onerror = (ev) => idbFS._onReadError(reject, path, ev);
      } else {
        const request = entryStore.openCursor(range);
        request.onsuccess = (ev) => {
          const cursor = (ev.target as IDBRequest).result as IDBCursorWithValue;
          if (cursor) {
            const key = cursor.key.toString();
            if (
              path !== key && // remove root dir
              slashCount === countSlash(key)
            ) {
              items.push({ path: key });
            }
            cursor.continue();
          }
          resolve(items);
        };
        request.onerror = (ev) => idbFS._onReadError(reject, path, ev);
      }
    });
  }

  public async _doMkcol(): Promise<void> {
    const now = Date.now();
    await this.idbFS._putEntry(this.path, {
      created: now,
      modified: now,
    });
  }
}
