import BoxClient from "box-node-sdk/lib/box-client";
import { Readable } from "stream";
import { bufferConverter, Data, EMPTY_BUFFER } from "univ-conv";
import {
  AbstractFile,
  getName,
  getParentPath,
  ReadOptions,
  Stats,
  WriteOptions,
} from "univ-fs";
import { BoxFileSystem } from "./BoxFileSystem";

export class BoxFile extends AbstractFile {
  constructor(private bfs: BoxFileSystem, path: string) {
    super(bfs, path);
  }

  public async _doRead(_stats: Stats, options: ReadOptions): Promise<Data> {
    const bfs = this.bfs;
    const path = this.path;
    try {
      const client = await bfs._getClient();
      const info = await bfs._getEntryInfo(path);
      if (info.size === 0) {
        return EMPTY_BUFFER;
      }
      return new Promise<Data>((resolve, reject) => {
        client.files.getReadStream(
          info.id,
          undefined,
          (err: any, readable: Readable) => {
            if (err) {
              reject(err);
              return;
            }
            this._getConverter()
              .convert(readable, "buffer", options)
              .then((buffer) => resolve(buffer))
              .catch((e) => reject(e));
          }
        );
      });
    } catch (e) {
      throw bfs._error(path, e, true);
    }
  }

  public async _doDelete(): Promise<void> {
    const bfs = this.bfs;
    const path = this.path;
    try {
      const client = await bfs._getClient();
      const info = await bfs._getInfo(path);
      await client.files.delete(info.id);
    } catch (e) {
      throw bfs._error(path, e, true);
    }
  }

  public async _doWrite(
    data: Data,
    stats: Stats | undefined,
    options: WriteOptions
  ): Promise<void> {
    const bfs = this.bfs;
    const path = this.path;
    const fullPath = bfs._getFullPath(path);

    let client: BoxClient;
    let buffer: Buffer;
    try {
      client = await bfs._getClient();
      buffer = await bufferConverter().convert(data, options);
    } catch (e) {
      throw bfs._error(path, e, true);
    }

    try {
      if (stats) {
        const info = await bfs._getInfoFromFullPath(fullPath, path);
        await client.files.uploadNewFileVersion(info.id, buffer);
      } else {
        const parentPath = getParentPath(fullPath);
        const name = getName(fullPath);
        const parent = await bfs._getInfoFromFullPath(parentPath, path);
        await client.files.uploadFile(parent.id, name, buffer);
      }
    } catch (e) {
      throw bfs._error(path, e, true);
    }
  }

  public supportAppend(): boolean {
    return false;
  }

  public supportRangeRead(): boolean {
    return true;
  }

  public supportRangeWrite(): boolean {
    return false;
  }
}
