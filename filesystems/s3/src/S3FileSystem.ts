import { AWSError } from "aws-sdk";
import S3, {
  ClientConfiguration,
  HeadObjectOutput,
  ListObjectsV2Output,
} from "aws-sdk/clients/s3";
import {
  AbstractDirectory,
  AbstractFile,
  AbstractFileSystem,
  EntryType,
  ErrorLike,
  FileSystemOptions,
  HeadOptions,
  joinPaths,
  NoModificationAllowedError,
  NotFoundError,
  NotReadableError,
  NotSupportedError,
  Stats,
  URLOptions,
} from "univ-fs";
import { S3Directory } from "./S3Directory";
import { S3File } from "./S3File";

export interface S3FileSystemOptions extends FileSystemOptions {
  canCreateDirectory?: boolean;
}

export interface Params {
  Bucket: string;
  Key: string;
}

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

const SECONDS_OF_DAY = 24 * 60 * 60;

export class S3FileSystem extends AbstractFileSystem {
  private client?: S3;

  public readonly canCreateDirectory: boolean;

  constructor(
    public bucket: string,
    repository: string,
    private config: ClientConfiguration,
    options?: S3FileSystemOptions
  ) {
    super(repository, options);
    this.canCreateDirectory = options?.canCreateDirectory ?? true;
  }

  public _createMetadata(props: Stats) {
    const metadata: { [key: string]: string } = {};
    for (const [key, value] of Object.entries(props)) {
      if (!value) continue;
      metadata[key] = "" + value; // eslint-disable-line
    }
    return metadata;
  }

  public _createParams(path: string, isDirectory: boolean): Params {
    const key = this._getKey(path, isDirectory);
    return {
      Bucket: this.bucket,
      Key: key,
    };
  }

  public _doGetDirectory(path: string): AbstractDirectory {
    return new S3Directory(this, path);
  }

  public _doGetFile(path: string): AbstractFile {
    return new S3File(this, path);
  }

  public async _doHead(path: string, options?: HeadOptions): Promise<Stats> {
    /* eslint-disable */
    const client = await this._getClient();
    if (!this.supportDirectory()) {
      try {
        const head = await client
          .headObject(this._createParams(path, false))
          .promise();
        return this._handleHead(head, false);
      } catch (e) {
        throw this._error(path, e, false);
      }
    }

    options = { ...options };
    const type = options.type;
    const isFile = !type || type === EntryType.File;
    const isDirectory = !type || type === EntryType.Directory;
    let fileHead: Promise<HeadObjectOutput>;
    if (isFile) {
      fileHead = client.headObject(this._createParams(path, false)).promise();
    } else {
      fileHead = Promise.reject();
    }
    let dirHead: Promise<HeadObjectOutput>;
    let dirList: Promise<ListObjectsV2Output>;
    if (isDirectory) {
      dirHead = client.headObject(this._createParams(path, true)).promise();
      dirList = client
        .listObjectsV2({
          Bucket: this.bucket,
          Delimiter: "/",
          Prefix: this._getKey(path, true),
          MaxKeys: 1,
        })
        .promise();
    } else {
      dirHead = Promise.reject();
      dirList = Promise.reject();
    }
    const [fileHeadRes, dirHeadRes, dirListRes] = await Promise.allSettled([
      fileHead,
      dirHead,
      dirList,
    ]);
    if (fileHeadRes.status === "fulfilled") {
      return this._handleHead(fileHeadRes.value, false);
    } else if (dirHeadRes.status === "fulfilled") {
      const stats = this._handleHead(dirHeadRes.value, true);
      delete stats.size;
      return stats;
    } else if (dirListRes.status === "fulfilled") {
      const res = dirListRes.value;
      if (
        (res.Contents && 0 < res.Contents.length) ||
        (res.CommonPrefixes && 0 < res.CommonPrefixes.length)
      ) {
        return {};
      }
    }
    let dirListReason: unknown | undefined;
    if (dirListRes.status === "rejected") {
      dirListReason = dirListRes.reason;
    }
    if (isFile) {
      throw this._error(path, fileHeadRes.reason, false);
    }
    if (isDirectory) {
      if (dirHeadRes.reason) {
        throw this._error(path, dirHeadRes.reason, false);
      }
    }
    throw this._error(path, dirListReason, false);
    /* eslint-enable */
  }

  public async _doPatch(
    path: string,
    _stats: Stats,
    props: Stats
  ): Promise<void> {
    const key = this._getKey(path, props.size == null);
    try {
      /* eslint-disable */
      const client = await this._getClient();
      await client
        .copyObject({
          Bucket: this.bucket,
          CopySource: this.bucket + "/" + key,
          Key: key,
          Metadata: this._createMetadata(props),
        })
        .promise();
      /* eslint-enable */
    } catch (e) {
      throw this._error(path, e, true);
    }
  }

  public async _doGetURL(
    path: string,
    isDirectory: boolean,
    options: URLOptions
  ): Promise<string> {
    try {
      /* eslint-disable */
      options = { expires: SECONDS_OF_DAY, ...options };
      const client = await this._getClient();
      const params = this._createParams(path, isDirectory);
      let url: string;
      switch (options.method) {
        case "GET": {
          url = client.getSignedUrl("getObject", { ...params });
          break;
        }
        case "PUT":
        case "POST": {
          url = client.getSignedUrl("putObject", { ...params });
          break;
        }
        case "DELETE": {
          url = client.getSignedUrl("deleteObject", { ...params });
          break;
        }
        default:
          throw this._createError({
            ...NotSupportedError,
            path,
            e: { message: `"${options.method}" is not supported` }, // eslint-disable-line
          });
      }
      return url;
      /* eslint-enable */
    } catch (e) {
      throw this._error(path, e, false);
    }
  }

  public _error(path: string, e: unknown, write: boolean) {
    /* eslint-disable */
    const err = e as AWSError;
    let error: ErrorLike;
    if (err.statusCode === 404) {
      error = NotFoundError;
    } else if (write) {
      error = NoModificationAllowedError;
    } else {
      error = NotReadableError;
    }
    return this._createError({
      ...error,
      path,
      e: e as ErrorLike,
    });
    /* eslint-enable */
  }

  public async _getClient() {
    /* eslint-disable */

    if (this.client) {
      return this.client;
    }

    this.client = new S3({ ...this.config });
    if (!this.supportDirectory()) {
      return this.client;
    }

    try {
      await this.client.headObject(this._createParams("/", true)).promise();
      return this.client;
    } catch (e: unknown) {
      const err = this._error("/", e, false);
      if (err.name !== NotFoundError.name) {
        throw err;
      }
    }
    try {
      await this.client
        .putObject({
          ...this._createParams("/", true),
          Body: "",
        })
        .promise();
      return this.client;
    } catch (e) {
      throw this._error("/", e, true);
    }
    /* eslint-enable */
  }

  public _getKey(path: string, isDirectory: boolean) {
    let key: string;
    if (!path || path === "/") {
      key = this.repository;
    } else {
      key = joinPaths(this.repository, path, false);
    }
    if (isDirectory) {
      key += "/";
    }
    return key;
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
    return this.canCreateDirectory;
  }

  private _handleHead(data: HeadObjectOutput, isDirectory: boolean) {
    /* eslint-disable */
    const stats: Stats = {};
    if (!isDirectory) {
      stats.size = data.ContentLength;
    }
    if (data.LastModified) {
      stats.modified = data.LastModified.getTime();
    }
    if (data.ETag) {
      stats.etag = data.ETag;
    }
    for (const [key, value] of Object.entries(data.Metadata ?? {})) {
      if (key === "size" || key === "etag") {
        continue;
      }
      stats[key] = value;
    }

    return stats;
    /* eslint-enable */
  }
}
