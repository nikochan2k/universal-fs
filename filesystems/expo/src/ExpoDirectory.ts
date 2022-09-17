import {
  deleteAsync,
  makeDirectoryAsync,
  readDirectoryAsync,
} from "expo-file-system";
import {
  AbstractDirectory,
  createError,
  Item,
  joinPaths,
  NoModificationAllowedError,
  NotReadableError,
} from "univ-fs";
import { ExpoFileSystem } from "./ExpoFileSystem";

export class ExpoDirectory extends AbstractDirectory {
  private readonly uri: string;

  constructor(efs: ExpoFileSystem, path: string) {
    super(efs, path);
    this.uri = efs._resolveURL(path);
  }

  public async _doDelete(): Promise<void> {
    try {
      // eslint-disable-next-line
      await deleteAsync(this.uri);
    } catch (e) {
      throw this._createError({
        ...NoModificationAllowedError,
        path: this.path,
        e,
      });
    }
  }

  public async _doList(): Promise<Item[]> {
    try {
      /* eslint-disable */
      const names = await readDirectoryAsync(this.uri);
      return names.map((name) => {
        return { path: joinPaths(this.path, name) };
      });
      /* eslint-enable */
    } catch (e) {
      throw createError({
        ...NotReadableError,
        path: this.path,
        e,
      });
    }
  }

  public async _doMkcol(): Promise<void> {
    try {
      // eslint-disable-next-line
      await makeDirectoryAsync(this.uri);
    } catch (e) {
      throw this._createError({
        ...NoModificationAllowedError,
        path: this.path,
        e,
      });
    }
  }
}
