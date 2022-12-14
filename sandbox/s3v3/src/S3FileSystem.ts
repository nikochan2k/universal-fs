import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandInput,
  HeadObjectCommandOutput,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
  S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  AbstractDirectory,
  AbstractFile,
  AbstractFileSystem,
  createMetadata,
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

export interface Command {
  Bucket: string;
  Key: string;
}

const SECONDS_OF_DAY = 24 * 60 * 60;

export class S3FileSystem extends AbstractFileSystem {
  private client?: S3Client;

  public readonly canCreateDirectory: boolean;

  constructor(
    public bucket: string,
    repository: string,
    private config: S3ClientConfig,
    options?: S3FileSystemOptions
  ) {
    super(repository, options);
    this.canCreateDirectory = options?.canCreateDirectory ?? true;
  }

  public _createCommand(path: string, isDirectory: boolean): Command {
    const key = this._getKey(path, isDirectory);
    return {
      Bucket: this.bucket,
      Key: key,
    };
  }

  public _dispose() {
    if (this.client) {
      // eslint-disable-next-line
      this.client.destroy();
    }
  }

  public _doGetDirectory(path: string): AbstractDirectory {
    return new S3Directory(this, path);
  }

  public _doGetFile(path: string): AbstractFile {
    return new S3File(this, path);
  }

  public async _doGetURL(
    path: string,
    isDirectory: boolean,
    options: URLOptions
  ): Promise<string> {
    try {
      options = { expires: SECONDS_OF_DAY, ...options };
      const client = await this._getClient();
      const params = this._createCommand(path, isDirectory);
      let url: string;
      switch (options.method) {
        case "GET": {
          const cmd = new GetObjectCommand(params);
          url = await getSignedUrl(client, cmd, { expiresIn: options.expires });
          break;
        }
        case "PUT":
        case "POST": {
          const cmd = new PutObjectCommand(params);
          url = await getSignedUrl(client, cmd, { expiresIn: options.expires });
          break;
        }
        case "DELETE": {
          const cmd = new DeleteObjectCommand(params);
          url = await getSignedUrl(client, cmd, { expiresIn: options.expires });
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
    } catch (e) {
      throw this._error(path, e, false);
    }
  }

  public async _doHead(path: string, options?: HeadOptions): Promise<Stats> {
    const client = await this._getClient();
    if (!this.supportDirectory()) {
      try {
        const headCmd = new HeadObjectCommand(this._createCommand(path, false));
        const head = await client.send(headCmd);
        return this._handleHead(head, false);
      } catch (e) {
        if ((e as ErrorLike).name !== NotFoundError.name) {
          throw this._error(path, e, false);
        }
      }
      try {
        const dirListCmd = new ListObjectsV2Command({
          Bucket: this.bucket,
          Delimiter: "/",
          Prefix: this._getKey(path, true),
          MaxKeys: 1,
        });
        const res = await client.send(dirListCmd);
        if (
          (res.Contents && 0 < res.Contents.length) ||
          (res.CommonPrefixes && 0 < res.CommonPrefixes.length)
        ) {
          return {};
        }
      } catch (e) {
        throw this._error(path, e, false);
      }
      throw this._error(path, NotFoundError, false);
    }

    options = { ...options };
    const type = options.type;
    const isFile = !type || type === EntryType.File;
    const isDirectory = !type || type === EntryType.Directory;
    let fileHead: Promise<HeadObjectCommandOutput>;
    if (isFile) {
      const fileHeadCmd = new HeadObjectCommand(
        this._createCommand(path, false)
      );
      fileHead = client.send(fileHeadCmd);
    } else {
      fileHead = Promise.reject();
    }
    let dirHead: Promise<HeadObjectCommandOutput>;
    let dirList: Promise<ListObjectsV2CommandOutput>;
    if (isDirectory) {
      const dirHeadCmd = new HeadObjectCommand(this._createCommand(path, true));
      dirHead = client.send(dirHeadCmd);
      const dirListCmd = new ListObjectsV2Command({
        Bucket: this.bucket,
        Delimiter: "/",
        Prefix: this._getKey(path, true),
        MaxKeys: 1,
      });
      dirList = client.send(dirListCmd);
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
    if (isFile) {
      throw this._error(path, fileHeadRes.reason, false);
    }
    if (isDirectory) {
      if (dirHeadRes.reason) {
        throw this._error(path, dirHeadRes.reason, false);
      }
    }
    // eslint-disable-next-line
    throw this._error(path, (dirListRes as any).reason, false);
  }

  public async _doPatch(
    path: string,
    _stats: Stats,
    props: Stats
  ): Promise<void> {
    const key = this._getKey(path, props.size == null);
    try {
      const cmd = new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: this.bucket + "/" + key,
        Key: key,
        Metadata: createMetadata(props),
      });
      const client = await this._getClient();
      await client.send(cmd);
    } catch (e) {
      throw this._error(path, e, true);
    }
  }

  public _error(path: string, e: unknown, write: boolean) {
    let error: ErrorLike;
    if (
      (e as any).name === "NotFound" || // eslint-disable-line
      (e as any).$metadata?.httpStatusCode === 404 // eslint-disable-line
    ) {
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

  public async _getClient() {
    if (this.client) {
      return this.client;
    }

    this.client = new S3Client({ ...this.config });
    if (!this.supportDirectory()) {
      return this.client;
    }

    const input: HeadObjectCommandInput | PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: this._getKey("/", true),
      Body: "",
    };
    try {
      const headCmd = new HeadObjectCommand(input);
      await this.client.send(headCmd);
      return this.client;
    } catch (e: unknown) {
      const err = this._error("/", e, false);
      if (err.name !== NotFoundError.name) {
        throw err;
      }
    }
    const putCmd = new PutObjectCommand(input);
    try {
      await this.client.send(putCmd);
      return this.client;
    } catch (e) {
      throw this._error("/", e, true);
    }
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

  private _handleHead(data: HeadObjectCommandOutput, isDirectory: boolean) {
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
  }
}
