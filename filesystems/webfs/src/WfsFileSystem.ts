import {
  AbstractFileSystem,
  Directory,
  File,
  FileSystemOptions,
  joinPaths,
  normalizePath,
  NotAllowedError,
  NotSupportedError,
  PatchOptions,
  QuotaExceededError,
  Stats,
  TypeMismatchError,
  URLOptions,
} from "univ-fs";
import { WfsDirectory } from "./WfsDirectory";
import { WfsFile } from "./WfsFile";

if (!Promise.allSettled) {
  /* eslint-disable */
  (Promise as any).allSettled = (promises: any) =>
    Promise.all(
      promises.map((p: any) =>
        p
          .then((value: any) => ({
            status: "fulfilled",
            value,
          }))
          .catch((reason: any) => ({
            status: "rejected",
            reason,
          }))
      )
    );
  /* eslint-enable */
}

const requestFileSystem =
  window.requestFileSystem || (window as any).webkitRequestFileSystem; // eslint-disable-line
export class WfsFileSystem extends AbstractFileSystem {
  private fs?: FileSystem;

  constructor(
    rootDir: string,
    private size: number,
    options?: FileSystemOptions
  ) {
    super(normalizePath(rootDir), options);
  }

  public _doGetDirectory(path: string): Directory {
    return new WfsDirectory(this, path);
  }

  public _doGetFile(path: string): File {
    return new WfsFile(this, path);
  }

  public async _doGetURL(
    path: string,
    isDirectory: boolean,
    options: URLOptions
  ): Promise<string> {
    options = { method: "GET", ...options };
    if (options.method !== "GET") {
      throw this._createError({
        ...NotSupportedError,
        path,
        e: { message: `"${options.method}" is not supported` }, // eslint-disable-line
      });
    }
    if (isDirectory) {
      throw this._createError({
        ...TypeMismatchError,
        path,
        e: { message: `"${path}" is not a directory` },
      });
    }
    const entry = await this.getFileSystemEntry(path);
    if (typeof entry.toURL === "function") {
      try {
        return entry.toURL();
      } catch (e) {
        console.debug(e);
      }
    }
    const file = this.getFile(path);
    const blob = await file.read("blob");
    return URL.createObjectURL(blob);
  }

  public async _doHead(path: string): Promise<Stats> {
    const entry = await this.getFileSystemEntry(path);
    return await new Promise<Stats>((resolve, reject) => {
      entry.getMetadata(
        (metadata) => {
          const modified = metadata.modificationTime.getTime();
          if (entry.isFile) {
            resolve({ modified, size: metadata.size });
          } else {
            resolve({ modified });
          }
        },
        (e: unknown) => reject(e)
      );
    });
  }

  public _doPatch(
    path: string,
    _stats: Stats, // eslint-disable-line
    _props: Stats, // eslint-disable-line
    _options: PatchOptions // eslint-disable-line
  ): Promise<void> {
    throw this._createError({
      ...NotSupportedError,
      path,
      e: { message: "patch is not supported" },
    });
  }

  public async _getFS() {
    if (this.fs) {
      return this.fs;
    }

    /* eslint-disable */
    if ((window as any).webkitStorageInfo) {
      await new Promise<void>((resolve, reject) => {
        const webkitStorageInfo = (window as any).webkitStorageInfo;
        webkitStorageInfo.requestQuota(
          window.PERSISTENT,
          this.size,
          () => resolve(),
          (e: unknown) =>
            reject(
              this._createError({
                ...QuotaExceededError,
                e,
              })
            )
        );
      });
    } else if ((navigator as any).webkitPersistentStorage) {
      await new Promise<void>((resolve, reject) => {
        const webkitPersistentStorage = (navigator as any)
          .webkitPersistentStorage;
        webkitPersistentStorage.requestQuota(
          this.size,
          () => resolve(),
          (e: unknown) =>
            reject(
              this._createError({
                ...QuotaExceededError,
                e,
              })
            )
        );
      });
    }
    /* eslint-enable */
    const fs = await new Promise<FileSystem>((resolve, reject) => {
      requestFileSystem(
        window.PERSISTENT,
        this.size,
        (fs) => resolve(fs),
        (e: unknown) =>
          reject(
            this._createError({
              ...NotAllowedError,
              e,
            })
          )
      );
    });
    await new Promise<void>((resolve, reject) => {
      fs.root.getDirectory(
        this.repository,
        { create: true },
        () => resolve(),
        (e: unknown) => reject(e)
      );
    });
    this.fs = fs;
    return fs;
  }

  public canPatchAccessed(): boolean {
    return false;
  }

  public canPatchCreated(): boolean {
    return false;
  }

  public canPatchModified(): boolean {
    return false;
  }

  public supportDirectory(): boolean {
    return true;
  }

  private async getFileSystemEntry(
    path: string
  ): Promise<FileSystemFileEntry | FileSystemDirectoryEntry> {
    const repository = this.repository;

    const fs = await this._getFS();
    const fullPath = joinPaths(repository, path);
    const filePromise = new Promise<FileSystemFileEntry>((resolve, reject) => {
      fs.root.getFile(fullPath, { create: false }, resolve, reject);
    });
    const dirPromise = new Promise<FileSystemDirectoryEntry>(
      (resolve, reject) => {
        fs.root.getDirectory(fullPath, { create: false }, resolve, reject);
      }
    );
    const results = await Promise.allSettled([filePromise, dirPromise]);
    if (results[0].status === "fulfilled") {
      return results[0].value;
    } else if (results[1].status === "fulfilled") {
      return results[1].value;
    } else {
      throw results[0].reason;
    }
  }
}
