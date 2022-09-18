import {
  BlobSASPermissions,
  BlobServiceClient,
  ContainerClient,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
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
import { AzureDirectory } from "./AzureDirectory";
import { AzureFile } from "./AzureFile";

export interface AzureFileSystemOptions extends FileSystemOptions {
  canCreateDirectory?: boolean;
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

export class AzureFileSystem extends AbstractFileSystem {
  private sharedKeyCredential: StorageSharedKeyCredential;

  public readonly canCreateDirectory: boolean;

  public containerClient: ContainerClient;
  public serviceClient: BlobServiceClient;

  constructor(
    public containerName: string,
    repository: string,
    accountName: string,
    accessKey: string,
    options?: AzureFileSystemOptions
  ) {
    super(repository, options);
    this.canCreateDirectory = options?.canCreateDirectory ?? true;
    this.sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accessKey
    );
    this.serviceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      this.sharedKeyCredential
    );
    this.containerClient = this.serviceClient.getContainerClient(containerName);
  }

  public _doGetDirectory(path: string): AbstractDirectory {
    return new AzureDirectory(this, path);
  }

  public _doGetFile(path: string): AbstractFile {
    return new AzureFile(this, path);
  }

  public _doGetURL(
    path: string,
    isDirectory: boolean,
    options: URLOptions
  ): Promise<string> {
    try {
      options = { expires: SECONDS_OF_DAY, ...options };
      const permissions = new BlobSASPermissions();
      switch (options.method) {
        case "GET": {
          permissions.read = true;
          break;
        }
        case "PUT":
          permissions.create = true;
          permissions.write = true;
          break;
        case "POST": {
          permissions.write = true;
          break;
        }
        case "DELETE": {
          permissions.delete = true;
          break;
        }
        default:
          throw this._createError({
            ...NotSupportedError,
            path,
            e: { message: `"${options.method}" is not supported` }, // eslint-disable-line
          });
      }
      const blobName = this._getBlobName(path, isDirectory);
      const sasToken = generateBlobSASQueryParameters(
        {
          containerName: this.containerName,
          blobName,
          expiresOn: new Date(Date.now() + SECONDS_OF_DAY * 1000),
          permissions,
        },
        this.sharedKeyCredential
      );
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      const url = `${blockBlobClient.url}?${sasToken.toString()}`;
      return Promise.resolve(url);
    } catch (e) {
      throw this._error(path, e, false);
    }
  }

  public async _doHead(path: string, options?: HeadOptions): Promise<Stats> {
    if (!this.supportDirectory()) {
      try {
        return await this._getStats(path, EntryType.File);
      } catch (e) {
        throw this._error(path, e, false);
      }
    }

    options = { ...options };
    const type = options.type;
    const isFile = !type || type === EntryType.File;
    let fileHead: Promise<Stats>;
    if (isFile) {
      fileHead = this._getStats(path, EntryType.File);
    } else {
      fileHead = Promise.reject();
    }

    const isDirectory = !type || type === EntryType.Directory;
    let dirHead: Promise<Stats> | undefined;
    let dirList: Promise<Stats> | undefined;
    if (isDirectory) {
      dirHead = this._getStats(path, EntryType.File);
      const list = this.containerClient.listBlobsFlat({
        prefix: this._getBlobName(path, true),
      });
      const res = await list.next();
      if (res.value) {
        dirList = Promise.resolve({});
      } else {
        dirList = Promise.reject();
      }
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
      return fileHeadRes.value;
    } else if (dirHeadRes.status === "fulfilled") {
      return dirHeadRes.value;
    } else if (dirListRes.status === "fulfilled") {
      return {};
    }
    if (isFile) {
      throw this._error(path, fileHeadRes.reason, false);
    }
    if (isDirectory) {
      if (dirHeadRes.reason) {
        throw this._error(path, dirHeadRes.reason, false);
      }
    }
    throw this._error(path, dirListRes.reason, false);
  }

  public async _doPatch(
    path: string,
    _stats: Stats,
    props: Stats
  ): Promise<void> {
    try {
      const client = this._getBlockBlobClient(path, props.size == null);
      const metadata = createMetadata(props);
      await client.setMetadata(metadata);
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

  public _getBlobName(path: string, isDirectory: boolean) {
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

  public _getBlockBlobClient(path: string, isDirectory: boolean) {
    const blobName = this._getBlobName(path, isDirectory);
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    return blockBlobClient;
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

  private async _getStats(path: string, type?: EntryType) {
    const isDirectory = type === EntryType.Directory;
    const client = this._getBlockBlobClient(path, isDirectory);
    const props = await client.getProperties();
    const stats: Stats = { ...props.metadata };
    if (props.createdOn) {
      stats.created = props.createdOn.getTime();
    }
    if (props.lastModified) {
      stats.modified = props.lastModified.getTime();
    }
    if (props.lastAccessed) {
      stats.accessed = props.lastAccessed.getTime();
    }
    if (isDirectory) {
      return stats;
    }
    stats.size = props.contentLength;
    if (props.etag) {
      stats.etag = props.etag;
    }
    return stats;
  }
}
