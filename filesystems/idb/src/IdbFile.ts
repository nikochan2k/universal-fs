import { Data } from "univ-conv";
import { AbstractFile, ReadOptions, Stats, WriteOptions } from "univ-fs";
import { CONTENT_STORE } from ".";
import { IdbFileSystem } from "./IdbFileSystem";

export class IdbFile extends AbstractFile {
  constructor(private idbFS: IdbFileSystem, path: string) {
    super(idbFS, path);
  }

  public async _doDelete(): Promise<void> {
    const idbFS = this.idbFS;
    const path = this.path;
    await idbFS._doDelete(path);
    const db = await idbFS._open();
    await new Promise<void>((resolve, reject) => {
      idbFS
        ._getObjectStore(db, CONTENT_STORE, "readwrite")
        .then((contentStore) => {
          const range = IDBKeyRange.only(path);
          const request = contentStore.delete(range);
          request.onsuccess = () => resolve();
          request.onerror = (ev) => idbFS._onWriteError(reject, path, ev);
        })
        .catch((e) => reject(e));
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async _doRead(stats: Stats, _options: ReadOptions): Promise<Data> {
    const idbFS = this.idbFS;
    const db = await idbFS._open();
    const data = await new Promise<Data>((resolve, reject) => {
      const path = this.path;
      idbFS
        ._getObjectStore(db, CONTENT_STORE, "readonly")
        .then((contentStore) => {
          const range = IDBKeyRange.only(path);
          const request = contentStore.get(range);
          request.onsuccess = async () => {
            let result = request.result as Data;
            if (result != null) {
              if (idbFS.idbOptions?.useAccessed) {
                await this.idbFS._putEntry(path, {
                  ...stats,
                  accessed: Date.now(),
                });
              }

              const conv = await this._getConverter();
              if (
                idbFS.storeType !== "blob" &&
                idbFS.storeType !== "arraybuffer"
              ) {
                result = await conv.convert("arraybuffer", result, {
                  inputStringType: "binary",
                });
              }
              resolve(result);
            } else {
              idbFS._onNotFound(reject, path, undefined);
            }
          };
          request.onerror = (ev) => idbFS._onReadError(reject, path, ev);
        })
        .catch((e) => reject(e));
    });
    return data;
  }

  public async _doWrite(
    data: Data,
    stats: Stats | undefined,
    options: WriteOptions
  ): Promise<void> {
    const idbFS = this.idbFS;
    const conv = await this._getConverter();
    let content: Blob | ArrayBuffer | string;
    if (idbFS.storeType === "blob") {
      content = await conv.convert("blob", data, options);
    } else if (idbFS.storeType === "arraybuffer") {
      content = await conv.convert("arraybuffer", data, options);
    } else {
      content = await conv.convert("binary", data, options);
    }

    const path = this.path;
    const db = await idbFS._open();
    return await new Promise<void>((resolve, reject) => {
      idbFS
        ._getObjectStore(db, CONTENT_STORE, "readwrite")
        .then((contentStore) => {
          const contentReq = contentStore.put(content, path);
          contentReq.onsuccess = async () => {
            try {
              stats = stats ?? { created: Date.now() };
              stats.size = await conv.size(content, options);
              stats.accessed = stats.modified = Date.now();
              await idbFS._doPatch(path, {}, stats, options);
              resolve();
            } catch (e) {
              idbFS._onWriteError(reject, path, e);
            }
          };
          contentReq.onerror = (ev) => idbFS._onWriteError(reject, path, ev);
        })
        .catch((e) => reject(e));
    });
  }

  public supportAppend(): boolean {
    return false;
  }

  public supportRangeRead(): boolean {
    return false; // TODO
  }

  public supportRangeWrite(): boolean {
    return false; // TODO
  }
}
