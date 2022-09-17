import { Bucket, Storage, StorageOptions } from "@google-cloud/storage";
import {
  AbstractDirectory,
  AbstractFile,
  AbstractFileSystem,
  ErrorLike,
  FileSystemOptions,
  joinPaths,
  NoModificationAllowedError,
  NotFoundError,
  NotReadableError,
  PatchOptions,
  Stats,
  URLOptions,
} from "univ-fs";
import { GCSDirectory } from "./GCSDirectory";
import { GCSFile } from "./GCSFile";

export interface Command {
  Bucket: string;
  Key: string;
}

const SECONDS_OF_DAY = 24 * 60 * 60;

export class GCSFileSystem extends AbstractFileSystem {
  private bucket?: Bucket;

  constructor(
    private bucketName: string,
    repository: string,
    private storageOptions: StorageOptions,
    options?: FileSystemOptions
  ) {
    super(repository, options);
  }

  public _createMetadata(props: Stats) {
    const metadata: { [key: string]: string } = {};
    for (const [key, value] of Object.entries(props)) {
      if (!value) continue;
      metadata[key] = "" + value; // eslint-disable-line
    }
    return metadata;
  }

  public _doGetDirectory(path: string): AbstractDirectory {
    return new GCSDirectory(this, path);
  }

  public _doGetFile(path: string): AbstractFile {
    return new GCSFile(this, path);
  }

  public async _doGetURL(
    path: string,
    _isDirectory: boolean,
    options: URLOptions
  ): Promise<string> {
    let action: "read" | "write" | "delete";
    switch (options.method) {
      case "GET":
        action = "read";
        break;
      case "PUT":
      case "POST":
        action = "write";
        break;
      case "DELETE":
        action = "delete";
        break;
      default:
        throw this._error(
          path,
          { message: `"${options.method}" is not supported` }, // eslint-disable-line
          false
        );
    }

    const file = this._getEntry(path, false);
    try {
      const expires = new Date(
        Date.now() + (options.expires ?? SECONDS_OF_DAY) * 1000
      );
      const res = await file.getSignedUrl({ action, expires });
      return res[0];
    } catch (e) {
      throw this._error(path, e, false);
    }
  }

  public async _doHead(path: string): Promise<Stats> {
    try {
      const res = await this._getMetadata(path, false);
      return this._handleHead(res);
    } catch (e) {
      throw this._error(path, e, false);
    }
  }

  public async _doPatch(
    path: string,
    _stats: Stats,
    props: Stats,
    _options: PatchOptions // eslint-disable-line
  ): Promise<void> {
    const entry = this._getEntry(path, props["size"] === null);
    try {
      const [obj] = await entry.getMetadata(); // eslint-disable-line
      obj.metadata = this._createMetadata(props); // eslint-disable-line
      await entry.setMetadata(obj);
    } catch (e) {
      throw this._error(path, e, true);
    }
  }

  public _error(path: string, e: unknown, write: boolean) {
    let error: ErrorLike;
    const code: number = (e as any).response?.statusCode; // eslint-disable-line
    if (code === 404) {
      error = NotFoundError;
    } else if (write) {
      error = NoModificationAllowedError;
    } else {
      error = NotReadableError;
    }
    return this._createError({
      ...error,
      path,
      e,
    });
  }

  public _getBucket() {
    if (this.bucket) {
      return this.bucket;
    }

    const storage = new Storage(this.storageOptions);
    this.bucket = storage.bucket(this.bucketName);
    return this.bucket;
  }

  public _getEntry(path: string, isDirectory: boolean) {
    const bucket = this._getBucket();
    const fullPath = this._getFullPath(path, isDirectory);
    return bucket.file(fullPath);
  }

  public _getFullPath(path: string, isDirectory: boolean) {
    let fullPath: string;
    if (!path || path === "/") {
      fullPath = this.repository;
    } else {
      fullPath = joinPaths(this.repository, path, false);
    }
    if (isDirectory) {
      fullPath += "/";
    }
    return fullPath;
  }

  public async _getMetadata(path: string, isDirectory: boolean) {
    const entry = this._getEntry(path, isDirectory);
    try {
      const res = await entry.getMetadata();
      return res[0] as { [key: string]: string };
    } catch (e) {
      throw this._error(path, e, false);
    }
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
    return false;
  }

  /* eslint-disable */
  private _handleHead(obj: any) {
    const metadata = obj.metadata ?? {};
    const stats: Stats = {};
    for (const [key, value] of Object.entries(metadata)) {
      stats[key] = value as string;
    }
    stats.size = parseInt(obj["size"] as string);
    const created = new Date(obj["timeCreated"] as string).getTime();
    if (created) {
      stats.created = created;
    }
    const modified = new Date(obj["updated"] as string).getTime();
    if (modified) {
      stats.modified = modified;
    }
    const etag = obj["etag"];
    if (etag) {
      stats.etag = etag;
    }

    return stats;
  }
  /* eslint-enable */
}
