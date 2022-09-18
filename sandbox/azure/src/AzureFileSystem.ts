import {
  BlobSASPermissions,
  BlobServiceClient,
  ContainerClient,
  generateBlobSASQueryParameters,
  RestError,
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

export interface AzureCredential {
  accessKey: string;
  accountName: string;
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

  public containerClient: ContainerClient;
  public serviceClient: BlobServiceClient;

  constructor(
    public containerName: string,
    repository: string,
    credential: AzureCredential,
    options?: FileSystemOptions
  ) {
    super(repository, options);

    this.sharedKeyCredential = new StorageSharedKeyCredential(
      credential.accountName,
      credential.accessKey
    );
    this.serviceClient = new BlobServiceClient(
      `https://${credential.accountName}.blob.core.windows.net`,
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

  public async _doHead(path: string): Promise<Stats> {
    try {
      return await this._getStats(path, EntryType.File);
    } catch (e) {
      throw this._error(path, e, false);
    }
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
    console.log(e);
    let error: ErrorLike | undefined;
    if (e instanceof RestError) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      if ((e as RestError).statusCode === 404) {
        error = NotFoundError;
      }
    }
    if (!error) {
      error = write ? NoModificationAllowedError : NotReadableError;
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
    return false;
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
