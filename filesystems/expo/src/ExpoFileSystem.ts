import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
} from "expo-file-system";
import {
  AbstractDirectory,
  AbstractFile,
  AbstractFileSystem,
  FileSystemOptions,
  normalizePath,
  NotReadableError,
  NotSupportedError,
  PatchOptions,
  Stats,
  URLOptions,
} from "univ-fs";
import { ExpoDirectory } from "./ExpoDirectory";
import { ExpoFile } from "./ExpoFile";

export interface ExpoFileSystemOptions extends FileSystemOptions {
  useEtag?: boolean;
}

export class ExpoFileSystem extends AbstractFileSystem {
  private readonly rootUri: string;

  constructor(rootDir: string, private expoFSOptions?: ExpoFileSystemOptions) {
    super(normalizePath(rootDir), expoFSOptions);
    /* eslint-disable */
    const rootUri = (documentDirectory ?? "").replace(/\/+$/, "") + rootDir;
    (async () => {
      const info = await getInfoAsync(rootUri);
      if (!info.exists) {
        await makeDirectoryAsync(rootUri);
      }
    })().catch((e) => {
      console.warn(e);
    });
    this.rootUri = rootUri;
    /* eslint-enable */
  }

  public _doGetDirectory(path: string): AbstractDirectory {
    return new ExpoDirectory(this, path);
  }

  public _doGetFile(path: string): AbstractFile {
    return new ExpoFile(this, path);
  }

  public async _doHead(path: string): Promise<Stats> {
    try {
      const uri = this._resolveURL(path);
      /* eslint-disable */
      const info = await getInfoAsync(uri, {
        size: true,
        md5: this.expoFSOptions?.useEtag,
      });
      return {
        modified: info.modificationTime,
        size: info.size,
        etag: info.md5,
      };
      /* eslint-enable */
    } catch (e) {
      throw this._createError({
        ...NotReadableError,
        path,
        e,
      });
    }
  }

  public _doPatch(
    path: string,
    _stats: Stats, // eslint-disable-line @typescript-eslint/no-unused-vars
    _props: Stats, // eslint-disable-line @typescript-eslint/no-unused-vars
    _options: PatchOptions // eslint-disable-line
  ): Promise<void> {
    throw this._createError({
      ...NotSupportedError,
      path,
      message: "patch is not supported",
    });
  }

  public _resolveURL(path: string) {
    return `${this.rootUri}${path}`;
  }

  public _doGetURL(
    path: string,
    _isDirectory: boolean, // eslint-disable-line
    _options?: URLOptions // eslint-disable-line
  ): Promise<string> {
    return Promise.resolve(this._resolveURL(path));
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
