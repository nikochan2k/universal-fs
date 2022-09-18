import { Data, DataType, DEFAULT_BUFFER_SIZE, ReturnData } from "univ-conv";
import { AbstractEntry } from "./AbstractEntry";
import { AbstractFile } from "./AbstractFile";
import {
  CopyOptions,
  DeleteOptions,
  Directory,
  Entry,
  EntryType,
  ExistsAction,
  File,
  FileSystem,
  FileSystemOptions,
  HeadOptions,
  ListOptions,
  MkcolOptions,
  MoveOptions,
  NoParentAction,
  NotExistAction,
  Options,
  PatchOptions,
  ReadOptions,
  Stats,
  URLOptions,
  WriteOptions,
} from "./core";
import {
  createError,
  ErrorParams,
  FileSystemError,
  isFileSystemError,
  NoModificationAllowedError,
  NotFoundError,
  NotReadableError,
  SyntaxError,
  TypeMismatchError,
} from "./errors";
import { INVALID_CHARS, normalizePath } from "./util";

interface CopyInfo {
  from: Entry;
  to: Entry;
}

export abstract class AbstractFileSystem implements FileSystem {
  public readonly defaultCopyOptions: CopyOptions;
  public readonly defaultDeleteOptions: DeleteOptions;
  public readonly defaultHeadOptions: HeadOptions;
  public readonly defaultMkcolOptions: MkcolOptions;
  public readonly defaultMoveOptions: MoveOptions;
  public readonly defaultPatchOptions: PatchOptions;
  public readonly defaultReadOptions: ReadOptions;
  public readonly defaultWriteOptions: WriteOptions;

  constructor(
    public readonly repository: string,
    public readonly options: FileSystemOptions = {}
  ) {
    this.defaultReadOptions = {
      // eslint-disable-next-line
      bufferSize: DEFAULT_BUFFER_SIZE,
      ignoreHook: false,
      ...options.defaultReadOptions,
    };
    this.defaultWriteOptions = {
      // eslint-disable-next-line
      bufferSize: DEFAULT_BUFFER_SIZE,
      append: false,
      onExists: ExistsAction.Overwrite,
      onNotExist: NotExistAction.Ignore,
      ignoreHook: false,
      ...options.defaultWriteOptions,
    };
    this.defaultHeadOptions = {
      ignoreHook: false,
      ...options.defaultHeadOptions,
    };
    this.defaultPatchOptions = {
      ignoreHook: false,
      ...options.defaultPatchOptions,
    };
    this.defaultMkcolOptions = {
      onExists: ExistsAction.Error,
      onNoParent: NoParentAction.Error,
      ignoreHook: false,
      ...options.defaultMkdirOptions,
    };
    this.defaultDeleteOptions = {
      onNotExist: NotExistAction.Error,
      recursive: false,
      ignoreHook: false,
      ...options.defaultDeleteOptions,
    };
    this.defaultMoveOptions = {
      // eslint-disable-next-line
      bufferSize: DEFAULT_BUFFER_SIZE,
      append: false,
      onExists: ExistsAction.Error,
      onNotExist: NotExistAction.Ignore,
      onNoParent: NoParentAction.Error,
      ignoreHook: false,
      ...options.defaultMoveOptions,
    };
    this.defaultCopyOptions = {
      // eslint-disable-next-line
      bufferSize: DEFAULT_BUFFER_SIZE,
      append: false,
      onExists: ExistsAction.Error,
      onNotExist: NotExistAction.Ignore,
      onNoParent: NoParentAction.Error,
      recursive: false,
      ignoreHook: false,
      ...options.defaultCopyOptions,
    };
  }

  public _createError(params: ErrorParams) {
    return createError({ ...params, repository: this.repository });
  }

  public async _handleError(
    params: ErrorParams,
    errors?: FileSystemError[],
    callback?: (error: FileSystemError) => Promise<void>
  ) {
    const error = this._createError(params);
    await this._handleFileSystemError(error, errors, callback);
  }

  public async _handleFileSystemError(
    error: FileSystemError,
    errors?: FileSystemError[],
    callback?: (error: FileSystemError) => Promise<void>
  ) {
    if (callback) {
      await callback(error);
    }
    if (errors) {
      errors.push(error);
      return;
    } else {
      throw error;
    }
  }

  public async copy(
    fromPath: string,
    toPath: string,
    options?: CopyOptions,
    errors?: FileSystemError[]
  ): Promise<boolean> {
    options = { ...this.defaultCopyOptions, ...options };

    let info: CopyInfo;
    try {
      info = await this._prepareCopy(fromPath, toPath, options);
    } catch (e) {
      if (errors) {
        errors.push(e as FileSystemError);
        return false;
      }
      throw e;
    }
    const { from, to } = info;
    return await from.copy(to, options, errors);
  }

  public cp = (
    fromPath: string,
    toPath: string,
    options?: CopyOptions,
    errors?: FileSystemError[]
  ) => this.copy(fromPath, toPath, options, errors);

  public del = (
    path: string,
    options?: DeleteOptions,
    errors?: FileSystemError[]
  ) => this.delete(path, options, errors);

  public async delete(
    path: string,
    options?: DeleteOptions,
    errors?: FileSystemError[]
  ): Promise<boolean> {
    const entry = await this.getEntry(path, options, errors);
    if (!entry) {
      return false;
    }
    return await entry.delete(options);
  }

  public dir(path: string, options?: ListOptions): Promise<string[]>;
  public dir(
    path: string,
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null>;
  public async dir(
    path: string,
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null> {
    return await this.list(path, options, errors);
  }

  public getDirectory(path: string): Directory {
    const checked = this._checkPath(path);
    return this._doGetDirectory(checked);
  }

  public async getEntry(path: string, options?: HeadOptions): Promise<Entry>;
  public async getEntry(
    path: string,
    options?: HeadOptions,
    errors?: FileSystemError[]
  ): Promise<Entry | null>;
  public async getEntry(
    path: string,
    options?: HeadOptions
  ): Promise<Entry | null> {
    options = { ...options };

    if (path.endsWith("/")) {
      if (!options.type) {
        options.type = EntryType.Directory;
      }
    }

    if (options.type === EntryType.File) {
      return this.getFile(path);
    }
    if (options.type === EntryType.Directory) {
      return this.getDirectory(path);
    }

    const stats = await this.head(path, options);
    const entry =
      stats.size != null ? this.getFile(path) : this.getDirectory(path);
    (entry as unknown as AbstractEntry).stats = stats;
    return entry;
  }

  public getFile(path: string): File {
    if (path.endsWith("/")) {
      throw createError({
        name: SyntaxError.name,
        repository: this.repository,
        path,
        message: `"${path}" seems to be a directory.`,
      });
    }
    const checked = this._checkPath(path);
    return this._doGetFile(checked);
  }

  public async getURL(path: string, options?: URLOptions): Promise<string>;
  public async getURL(
    path: string,
    options?: URLOptions,
    errors?: FileSystemError[]
  ): Promise<string | null>;
  public async getURL(
    path: string,
    options?: URLOptions,
    errors?: FileSystemError[]
  ): Promise<string | null> {
    options = { method: "GET", ...options };
    const stats = await this.head(path, options, errors);
    if (stats == null) {
      return null;
    }
    return await this._doGetURL(path, stats.size == null, options);
  }

  public async hash(path: string, options?: ReadOptions): Promise<string>;
  public async hash(
    path: string,
    options?: ReadOptions,
    errors?: FileSystemError[]
  ): Promise<string | null>;
  public async hash(
    path: string,
    options?: ReadOptions,
    errors?: FileSystemError[]
  ): Promise<string | null> {
    const file = this.getFile(path);
    if (file == null) {
      return null;
    }
    return await file.hash(options, errors);
  }

  public async head(path: string, options?: HeadOptions): Promise<Stats>;
  public async head(
    path: string,
    options?: HeadOptions,
    errors?: FileSystemError[]
  ): Promise<Stats | null>;
  public async head(
    path: string,
    options?: HeadOptions,
    errors?: FileSystemError[]
  ): Promise<Stats | null> {
    options = { ...this.defaultHeadOptions, ...options };

    if (!options.type) {
      if (path.endsWith("/")) {
        options.type = EntryType.Directory;
      }
    }
    path = this._checkPath(path);

    try {
      let stats = await this._beforeHead(path, options);
      if (stats) {
        return stats;
      }

      stats = await this.$head(path, options);
      await this._afterHead(path, stats, options);
      return stats;
    } catch (e) {
      const opts = options;
      await this._handleError(
        {
          ...NotReadableError,
          path,
          e,
        },
        errors,
        async (error) => {
          await this._afterHead(path, null, opts, error);
        }
      );
      return null;
    }
  }

  public async list(path: string, options?: ListOptions): Promise<string[]>;
  public async list(
    path: string,
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null>;
  public async list(
    path: string,
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null> {
    const dir = this.getDirectory(path);
    return await dir.list(options, errors);
  }

  public ls(path: string, options?: ListOptions): Promise<string[]>;
  public async ls(
    path: string,
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null> {
    return await this.list(path, options, errors);
  }

  public async mkcol(
    path: string,
    options?: MkcolOptions,
    errors?: FileSystemError[]
  ): Promise<boolean> {
    const dir = this.getDirectory(path);
    return await dir.mkcol(options, errors);
  }

  public mkdir = (
    path: string,
    options?: MkcolOptions,
    errors?: FileSystemError[]
  ) => this.mkcol(path, options, errors);

  public async move(
    fromPath: string,
    toPath: string,
    options?: MoveOptions,
    errors?: FileSystemError[]
  ): Promise<boolean> {
    options = { ...this.defaultMoveOptions, ...options };

    let info: CopyInfo;
    try {
      info = await this._prepareCopy(fromPath, toPath, options);
    } catch (e) {
      if (errors) {
        errors.push(e as FileSystemError);
        return false;
      }
      throw e;
    }
    const { from, to } = info;
    return await from.move(to, options, errors);
  }

  public mv = (
    fromPath: string,
    toPath: string,
    options?: MoveOptions,
    errors?: FileSystemError[]
  ) => this.move(fromPath, toPath, options, errors);

  public async patch(
    path: string,
    props: Stats,
    options?: PatchOptions,
    errors?: FileSystemError[]
  ): Promise<boolean> {
    path = this._checkPath(path);

    options = { ...this.defaultPatchOptions, ...options };
    if (path.endsWith("/")) {
      if (!options.type) {
        options.type = EntryType.Directory;
      }
    }

    const stats = await this.head(path, options, errors);
    if (!stats) {
      return false;
    }
    this._fixProps(path, props, stats);

    try {
      const result = await this._beforePatch(path, props, options);
      if (result != null) {
        return result;
      }
      await this._doPatch(path, stats, props, options);
      await this._afterPatch(path, true, options);
      return true;
    } catch (e) {
      const opts = options;
      await this._handleError(
        {
          ...NoModificationAllowedError,
          path,
          e,
        },
        errors,
        async (errors) => {
          await this._afterPatch(path, false, opts, errors);
        }
      );
      return false;
    }
  }

  public async read<T extends DataType>(
    path: string,
    type?: T,
    options?: ReadOptions
  ): Promise<ReturnData<T>>;
  public async read<T extends DataType>(
    path: string,
    type?: T,
    options?: ReadOptions,
    errors?: FileSystemError[]
  ): Promise<ReturnData<T> | null> {
    const file = this.getFile(path);
    return await file.read(type, options, errors);
  }

  public readdir(
    path: string,
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[]>;
  public readdir(
    path: string,
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null> {
    return this.list(path, options, errors);
  }

  public rm = (
    path: string,
    options?: DeleteOptions,
    errors?: FileSystemError[]
  ) => this.delete(path, options, errors);

  public stat(path: string, options?: HeadOptions): Promise<Stats>;
  public stat(
    path: string,
    options?: HeadOptions,
    errors?: FileSystemError[]
  ): Promise<Stats | null>;
  public async stat(
    path: string,
    options?: HeadOptions,
    errors?: FileSystemError[]
  ): Promise<Stats | null> {
    return await this.head(path, options, errors);
  }

  public unlink = (path: string, options?: DeleteOptions) =>
    this.delete(path, options);

  public async write(
    path: string,
    data: Data,
    options?: WriteOptions,
    errors?: FileSystemError[]
  ): Promise<boolean> {
    const file = this.getFile(path);
    return await file.write(data, options, errors);
  }

  public abstract _doGetDirectory(path: string): Directory;
  public abstract _doGetFile(path: string): File;
  public abstract _doGetURL(
    path: string,
    isDirectory: boolean,
    options: URLOptions
  ): Promise<string>;
  public abstract _doHead(path: string, options: HeadOptions): Promise<Stats>;
  public abstract _doPatch(
    path: string,
    stats: Stats,
    props: Stats,
    options: PatchOptions
  ): Promise<void>;
  public abstract canPatchAccessed(): boolean;
  public abstract canPatchCreated(): boolean;
  public abstract canPatchModified(): boolean;
  public abstract supportDirectory(): boolean;

  protected async $head(
    path: string,
    options: HeadOptions
  ): Promise<Stats | null> {
    if (options.type === EntryType.Directory && !this.supportDirectory()) {
      return {};
    }

    const stats = await this._doHead(path, options);
    let errorMessage: string | undefined;
    if (stats.size != null && options.type === EntryType.Directory) {
      errorMessage = `"${path}" is not a directory`;
    }
    if (stats.size == null && options.type === EntryType.File) {
      errorMessage = `"${path}" is not a file`;
    }
    if (errorMessage) {
      throw createError({
        ...TypeMismatchError,
        repository: this.repository,
        path,
        message: errorMessage,
      });
    }

    return stats;
  }

  protected async _afterHead(
    path: string,
    stats: Stats | null,
    options: HeadOptions,
    error?: FileSystemError
  ) {
    const afterHead = this.options.hook?.afterHead;
    if (afterHead && !options.ignoreHook) {
      await afterHead(this.repository, path, options, stats, error);
    }
  }

  protected async _afterPatch(
    path: string,
    result: boolean,
    options: PatchOptions,
    error?: FileSystemError
  ) {
    const afterPatch = this.options.hook?.afterPatch;
    if (afterPatch && !options.ignoreHook) {
      await afterPatch(this.repository, path, options, result, error);
    }
  }

  protected async _beforeHead(path: string, options: HeadOptions) {
    const beforeHead = this.options.hook?.beforeHead;
    if (beforeHead && !options?.ignoreHook) {
      return await beforeHead(this.repository, path, options);
    }
    return null;
  }

  protected async _beforePatch(
    path: string,
    props: Stats,
    options: PatchOptions
  ) {
    const beforePatch = this.options.hook?.beforePatch;
    if (beforePatch && !options.ignoreHook) {
      return await beforePatch(this.repository, path, props, options);
    }
    return null;
  }

  protected _checkPath(path: string): string {
    if (!path || INVALID_CHARS.test(path)) {
      throw createError({
        name: SyntaxError.name,
        repository: this.repository,
        path,
        message: `"${path}" is invalid`,
      });
    }
    return normalizePath(path);
  }

  protected _fixProps(path: string, props: Stats, stats: Stats) {
    if (props.size != null) {
      console.warn(`Cannot change size: ${path}`);
      delete props.size; // Cannot change size
    }
    if (props.etag != null) {
      console.warn(`Cannot change etag: ${path}`);
      delete props.etag;
    }
    if (this.canPatchAccessed()) {
      if (typeof props.accessed !== "number") {
        console.warn(`Access time (${props.accessed}) is illegal: ${path}`); // eslint-disable-line
        delete props.accessed;
      }
    } else {
      console.warn(
        `Cannot patch access time on the FileSystem: ${this.constructor.name}`
      ); // eslint-disable-line
      delete props.accessed;
    }
    if (this.canPatchCreated()) {
      if (typeof props.created !== "number") {
        console.warn(`Creation time (${props.created}) is illegal: ${path}`); // eslint-disable-line
        delete props.created;
      }
    } else {
      console.warn(
        `Cannot patch creation time on the FileSystem: ${this.constructor.name}`
      ); // eslint-disable-line
      delete props.created;
    }
    if (this.canPatchModified()) {
      if (typeof props.modified !== "number") {
        console.warn(
          `Modification time (${props.modified}) is illegal: ${path}` // eslint-disable-line
        );
        delete props.modified;
      }
    } else {
      console.warn(
        `Cannot patch modification time on the FileSystem: ${this.constructor.name}`
      ); // eslint-disable-line
      delete props.modified;
    }
    for (const key of Object.keys(stats)) {
      if (stats[key] === props[key]) {
        delete props[key]; // Not changed
      } else if (
        typeof stats[key] !== typeof props[key] &&
        typeof props[key] !== "undefined"
      ) {
        console.warn(`Illetal type stats[${key}]: ${props[key]}`); // eslint-disable-line
        delete props[key];
      }
    }
  }

  private async _prepareCopy(
    fromPath: string,
    toPath: string,
    options?: Options
  ): Promise<CopyInfo> {
    let from: Entry;
    try {
      from = await this.getEntry(fromPath, options);
    } catch (e) {
      if (isFileSystemError(e) && e.name === NotFoundError.name) {
        if (!this.supportDirectory()) {
          from = this.getDirectory(fromPath);
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }

    const to =
      from instanceof AbstractFile
        ? this.getFile(toPath)
        : this.getDirectory(toPath);

    return { from, to };
  }
}
