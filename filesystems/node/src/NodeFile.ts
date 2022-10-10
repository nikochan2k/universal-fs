import * as fs from "fs";
import { ConvertOptions, Data } from "univ-conv";
import {
  AbstractFile,
  joinPaths,
  ReadOptions,
  Stats,
  WriteOptions,
} from "univ-fs";
import { NodeFileSystem } from "./NodeFileSystem";

export class NodeFile extends AbstractFile {
  constructor(private nfs: NodeFileSystem, path: string) {
    super(nfs, path);
  }

  public _doDelete(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.rm(this._getFullPath(), { force: true }, (err) => {
        if (err) {
          reject(this.nfs._error(this.path, err, true));
        } else {
          resolve();
        }
      });
    });
  }

  public async _doRead(_stats: Stats, options: ReadOptions): Promise<Data> {
    try {
      let readable = fs.createReadStream(this._getFullPath(), {
        flags: "r",
        highWaterMark: options.bufferSize,
        start: options.start,
      });

      if (0 < (options.length as number)) {
        const co: Partial<ConvertOptions> = { ...options };
        delete co.start;
        const conv = await this._getConverter();
        readable = await conv.slice(readable, co);
      }

      return readable;
    } catch (e: unknown) {
      throw this.nfs._error(this.path, e as NodeJS.ErrnoException, false);
    }
  }

  public async _doWrite(
    data: Data,
    _stats: Stats | null | undefined,
    options: WriteOptions
  ): Promise<void> {
    try {
      const writable = fs.createWriteStream(this._getFullPath(), {
        flags: options.append ? "a" : "w",
        highWaterMark: options.bufferSize,
        start: options.start,
      });

      const conv = await this._getConverter();
      if (options.length != null && 0 < options.length) {
        const co = { ...options };
        delete co.start;
        data = await conv.slice(data, co);
      }

      await conv.pipe(data, writable);
    } catch (e) {
      throw this.nfs._error(this.path, e as NodeJS.ErrnoException, true);
    }
  }

  public _getFullPath() {
    return joinPaths(this.fs.repository, this.path);
  }

  public supportAppend(): boolean {
    return true;
  }

  public supportRangeRead(): boolean {
    return true;
  }

  public supportRangeWrite(): boolean {
    return true;
  }
}
