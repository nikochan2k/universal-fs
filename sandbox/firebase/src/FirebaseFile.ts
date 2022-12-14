import { deleteObject, uploadBytes } from "@firebase/storage";
import fetch from "isomorphic-fetch";
import { Data, isBrowser } from "univ-conv";
import {
  AbstractFile,
  NotFoundError,
  NotReadableError,
  Stats,
  WriteOptions,
} from "univ-fs";
import { FirebaseFileSystem } from "./FirebaseFileSystem";

export class FirebaseFile extends AbstractFile {
  constructor(private ffs: FirebaseFileSystem, path: string) {
    super(ffs, path);
  }

  public async _doDelete(): Promise<void> {
    const ffs = this.ffs;
    const path = this.path;
    const file = await this.ffs._getEntry(path, false);
    try {
      await deleteObject(file);
    } catch (e) {
      throw ffs._error(path, e, true);
    }
  }

  public async _doRead(): Promise<Data> {
    const ffs = this.ffs;
    const path = this.path;
    const url = await ffs._doGetURL(path, false, { method: "GET" });
    let response: Response;
    try {
      // eslint-disable-next-line
      response = await fetch(url);
    } catch (e: unknown) {
      throw this._createError({
        ...NotReadableError,
        path,
        e,
      });
    }
    if (response.status === 404) {
      throw this._createError({
        ...NotFoundError,
        path,
      });
    }
    if (response.status !== 200 || !response.body) {
      throw this._createError({
        ...NotReadableError,
        path,
        e: {
          message: `${response.statusText} (${response.status})`, // eslint-disable-line
        },
      });
    }
    return response.body;
  }

  public async _doWrite(
    data: Data,
    _stats: Stats | undefined,
    options: WriteOptions
  ): Promise<void> {
    const ffs = this.ffs;
    const path = this.path;
    const conv = await this._getConverter();

    const file = await this.ffs._getEntry(path, false);
    try {
      if (isBrowser) {
        const blob = await conv.convert("blob", data, options);
        await uploadBytes(file, blob);
      } else {
        const buffer = await conv.convert("arraybuffer", data, options);
        await uploadBytes(file, buffer);
      }
    } catch (e) {
      throw ffs._error(path, e, true);
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
