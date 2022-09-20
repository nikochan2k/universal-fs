import BoxSDK from "box-node-sdk";
import BoxClient from "box-node-sdk/lib/box-client";
import {
  AbstractFileSystem,
  createError,
  Directory,
  File,
  FileSystemOptions,
  getParentPath,
  HeadOptions,
  isFileSystemError,
  joinPaths,
  NoModificationAllowedError,
  NotFoundError,
  NotReadableError,
  Options,
  Stats,
  URLOptions,
} from "univ-fs";
import { BoxDirectory } from "./BoxDirectory";
import { BoxFile } from "./BoxFile";

export interface BoxAppAuth {
  passphrase: string;
  privateKey: string;
  publicKeyID: string;
}

export interface BoxCredentials {
  appAuth?: BoxAppAuth;
  clientID: string;
  clientSecret: string;
}

export interface Info {
  etag?: string;
  id: string;
  name: string;
  type: "file" | "folder";
}

export interface EntryInfo extends Info {
  created_at?: string;
  item_status: "active" | "trashed" | "deleted";
  modified_at?: string;
  parent?: Info;
  size?: number;
}

const ROOT_FOLDER: EntryInfo = {
  id: "0",
  type: "folder",
  name: "",
  item_status: "active",
};

export class BoxFileSystem extends AbstractFileSystem {
  private readonly id: string;
  private readonly isBasicClient: boolean;
  private readonly sdk: BoxSDK;

  private client?: BoxClient;

  constructor(
    repository: string,
    credentials: BoxCredentials,
    developerTokenOrEnterpriseId: string,
    options?: FileSystemOptions
  ) {
    super(repository, options);
    this.id = developerTokenOrEnterpriseId;
    if (credentials.appAuth) {
      this.sdk = BoxSDK.getPreconfiguredInstance(credentials);
      this.isBasicClient = false;
    } else {
      this.sdk = new BoxSDK(credentials);
      this.isBasicClient = true;
    }
  }

  public _error(path: string, e: unknown, write: boolean) {
    if (isFileSystemError(e)) {
      throw e;
    }

    let name: string;
    const code: number = (e as any).response?.statusCode; // eslint-disable-line
    if (code === 404) {
      name = NotFoundError.name!;
    } else if (write) {
      name = NoModificationAllowedError.name!;
    } else {
      name = NotReadableError.name!;
    }
    return createError({
      name,
      repository: this.repository,
      path,
      e: e as any, // eslint-disable-line
    });
  }

  public async _getClient() {
    if (this.client) {
      return this.client;
    }

    if (this.isBasicClient) {
      this.client = this.sdk.getBasicClient(this.id);
    } else {
      this.client = this.sdk.getAppAuthClient("enterprise", this.id);
    }

    try {
      await this.client.folders.create("0", this.repository);
    } catch (e) {
      if ((e as any).statusCode !== 409) {
        throw e;
      }
    }
    return this.client;
  }

  public _doGetDirectory(path: string): Directory {
    return new BoxDirectory(this, path);
  }

  public async _getEntryInfo(path: string): Promise<EntryInfo> {
    const info = await this._getInfo(path);
    const client = await this._getClient();
    let entryInfo: EntryInfo;
    if (info.type === "file") {
      entryInfo = await client.files.get(info.id);
    } else {
      entryInfo = await client.folders.get(info.id);
    }
    return entryInfo;
  }

  public _doGetFile(path: string): File {
    return new BoxFile(this, path);
  }

  public _getFullPath(path: string) {
    let fullPath = "/";
    if (!path || path === "/") {
      fullPath += this.repository;
    } else {
      fullPath += joinPaths(this.repository, path, false);
    }
    return fullPath;
  }

  public async _getInfo(path: string): Promise<Info> {
    const fullPath = this._getFullPath(path);
    return this._getInfoFromFullPath(fullPath, path);
  }

  public async _getInfoFromFullPath(
    fullPath: string,
    originalPath: string
  ): Promise<Info> {
    if (fullPath === "/") {
      return ROOT_FOLDER;
    }

    const parentPath = getParentPath(fullPath);
    const parent = await this._getInfoFromFullPath(parentPath, originalPath);
    const client = await this._getClient();
    const items = await client.folders.getItems(parent.id);
    for (const entry of items.entries) {
      const childPath =
        (parentPath === "/" ? "" : parentPath) + "/" + entry.name;
      if (fullPath === childPath) {
        return entry;
      }
    }

    throw createError({
      name: NotFoundError.name,
      repository: this.repository,
      path: originalPath,
    });
  }

  public async _doHead(path: string, _options: HeadOptions): Promise<Stats> {
    const repository = this.repository;
    try {
      const info = await this._getEntryInfo(path);
      if (info.item_status !== "active") {
        throw createError({
          name: NotFoundError.name,
          repository,
          path,
        });
      }
      const stats: Stats = info as any;
      const created = new Date(info.created_at as string).getTime();
      if (!isNaN(created)) {
        stats.created = created;
      }
      const modified = new Date(info.modified_at as string).getTime();
      if (!isNaN(modified)) {
        stats.modified = modified;
      }
      if (info.type === "folder") {
        delete stats.size;
      }

      return stats;
    } catch (e) {
      throw this._error(path, e, false);
    }
  }

  public async _doPatch(
    path: string,
    _stats: Stats,
    props: Stats,
    _: Options
  ): Promise<void> {
    if (props.created) {
      props["created_at"] = new Date(props.created).toISOString();
      delete props.created;
    }
    if (props.modified) {
      props["modified_at"] = new Date(props.modified).toISOString();
      delete props.modified;
    }

    delete props["fields"];
    const keys = Object.entries(props);
    const fields = keys.join(",");

    try {
      const client = await this._getClient();
      const info = await this._getInfo(path);
      const id = info.id;
      if (info.type === "file") {
        await client.files.update(id, { ...props, fields });
      } else {
        await client.folders.update(id, { ...props, fields });
      }
    } catch (e) {
      throw this._error(path, e, true);
    }
  }

  public async _doGetURL(
    path: string,
    _isDirectory: boolean,
    options: URLOptions
  ): Promise<string> {
    options = { method: "GET", ...options };
    if (options.method !== "GET") {
      throw this._error(
        path,
        { message: `"${options.method}" is not supported` }, // eslint-disable-line
        false
      );
    }

    const info = await this._getInfo(path);
    const client = await this._getClient();
    return client.files.getDownloadURL(info.id);
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
}
