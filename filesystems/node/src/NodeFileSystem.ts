import * as fs from "fs";
import {
  AbstractDirectory,
  AbstractFile,
  AbstractFileSystem,
  createError,
  ErrorLike,
  FileSystemOptions,
  InvalidModificationError,
  joinPaths,
  NoModificationAllowedError,
  normalizePath,
  NotFoundError,
  NotReadableError,
  NotSupportedError,
  PathExistError,
  QuotaExceededError,
  Stats,
  TypeMismatchError,
} from "univ-fs";
import { pathToFileURL } from "url";
import { NodeDirectory } from "./NodeDirectory";
import { NodeFile } from "./NodeFile";

export class NodeFileSystem extends AbstractFileSystem {
  constructor(rootDir: string, options?: FileSystemOptions) {
    super(normalizePath(rootDir), options);
    fs.mkdirSync(rootDir, { recursive: true });
  }

  public _doGetDirectory(path: string): AbstractDirectory {
    return new NodeDirectory(this, path);
  }

  public _doGetFile(path: string): AbstractFile {
    return new NodeFile(this, path);
  }

  public _doGetURL(path: string): Promise<string> {
    const fullPath = this.getFullPath(path);
    const url = pathToFileURL(fullPath).href;
    return Promise.resolve(url);
  }

  public _doHead(path: string): Promise<Stats> {
    return new Promise<Stats>((resolve, reject) => {
      fs.stat(this.getFullPath(path), (err, stats) => {
        if (err) {
          reject(this._error(path, err, false));
        } else {
          if (stats.isDirectory()) {
            resolve({
              accessed: stats.atimeMs,
              modified: stats.mtimeMs,
            });
          } else {
            resolve({
              size: stats.size,
              accessed: stats.atimeMs,
              modified: stats.mtimeMs,
            });
          }
        }
      });
    });
  }

  public _doPatch(path: string, stats: Stats, props: Stats): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.utimes(
        this.getFullPath(path),
        props.accessed ?? (stats.accessed as number),
        props.modified ?? (stats.modified as number),
        (err) => {
          if (err) {
            reject(this._error(path, err, true));
          } else {
            resolve();
          }
        }
      );
    });
  }

  public _error(path: string, err: NodeJS.ErrnoException, write: boolean) {
    const e = err as unknown as ErrorLike;
    const code = err.code;
    if (code) {
      switch (code) {
        case "ENOENT": // No such file or directory
          return createError({
            ...NotFoundError,
            repository: this.repository,
            path,
            e,
          });
        case "ENOTDIR": // Not a directory
        case "EISDIR": // Is a directory
          return createError({
            ...TypeMismatchError,
            repository: this.repository,
            path,
            e,
          });
        case "EEXIST": // File exists
          return createError({
            ...PathExistError,
            repository: this.repository,
            path,
            e,
          });
        case "EDQUOT": // Quota exceeded
          return createError({
            ...QuotaExceededError,
            repository: this.repository,
            path,
            e,
          });
        case "EINVAL": // Invalid argument
          if (write) {
            return createError({
              ...InvalidModificationError,
              repository: this.repository,
              path,
              e,
            });
          }
      }
      if (0 <= code.indexOf("NOSUPPORT")) {
        return createError({
          ...NotSupportedError,
          repository: this.repository,
          path,
          e,
        });
      }
    }
    if (write) {
      return createError({
        ...NoModificationAllowedError,
        repository: this.repository,
        path,
        e,
      });
    } else {
      return createError({
        ...NotReadableError,
        repository: this.repository,
        path,
        e,
      });
    }
  }

  public canPatchAccessed(): boolean {
    return true;
  }

  public canPatchCreated(): boolean {
    return false;
  }

  public canPatchModified(): boolean {
    return true;
  }

  public supportDirectory(): boolean {
    return true;
  }

  protected getFullPath(path: string) {
    return joinPaths(this.repository, path);
  }
}
