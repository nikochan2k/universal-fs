import { AbstractFileSystem } from "./AbstractFileSystem";
import {
  CopyOptions,
  DeleteOptions,
  Directory,
  Entry,
  HeadOptions,
  MoveOptions,
  NotExistAction,
  PatchOptions,
  Stats,
  URLOptions,
} from "./core";
import {
  createError,
  FileSystemError,
  isFileSystemError,
  NoModificationAllowedError,
  NotFoundError,
  NotReadableError,
  TypeMismatchError,
} from "./errors";
import { getParentPath } from "./util";

interface ErrorParams {
  code?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  e?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message?: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export abstract class AbstractEntry implements Entry {
  public stats: Stats | undefined | null;

  constructor(
    public readonly fs: AbstractFileSystem,
    public readonly path: string
  ) {}

  public async copy(
    to: Entry,
    options?: CopyOptions,
    errors?: FileSystemError[]
  ): Promise<boolean> {
    options = { ...this.fs.defaultCopyOptions, ...options };
    return this._copy(to, options, errors);
  }

  public cp = (to: Entry, options?: CopyOptions, errors?: FileSystemError[]) =>
    this.copy(to, options, errors);

  public del = (options?: DeleteOptions, errors?: FileSystemError[]) =>
    this.delete(options, errors);

  public async delete(
    options?: DeleteOptions,
    errors?: FileSystemError[]
  ): Promise<boolean> {
    options = { ...this.fs.defaultDeleteOptions, ...options };
    try {
      const result = await this.$delete(options, errors);
      await this._afterDelete(result, options);
      return result;
    } catch (e) {
      const opts = options;
      await this._handleNoModificationAllowedError(
        { e },
        errors,
        async (error) => {
          await this._afterDelete(false, opts, error);
        }
      );
      return false;
    } finally {
      this.stats = undefined;
    }
  }

  public getParent(): Directory {
    const parentPath = getParentPath(this.path);
    return this.fs.getDirectory(parentPath);
  }

  public async move(
    to: Entry,
    options?: MoveOptions,
    errors?: FileSystemError[]
  ): Promise<boolean> {
    let result = await this._copy(
      to,
      {
        ...this.fs.defaultMoveOptions,
        ...options,
        recursive: true,
      },
      errors
    );
    if (!result) {
      return false;
    }

    result = await this.delete(
      {
        ...this.fs.defaultDeleteOptions,
        ...options,
        recursive: true,
      },
      errors
    );
    return result;
  }

  public mv = (to: Entry, options?: MoveOptions, errors?: FileSystemError[]) =>
    this.move(to, options, errors);

  public patch = (
    props: Stats,
    options?: PatchOptions,
    errors?: FileSystemError[]
  ) => this.fs.patch(this.path, props, options, errors);

  public remove = (options?: DeleteOptions, errors?: FileSystemError[]) =>
    this.delete(options, errors);

  public rm = (options?: DeleteOptions, errors?: FileSystemError[]) =>
    this.delete(options, errors);

  public stat(options?: HeadOptions): Promise<Stats>;
  public stat(options?: HeadOptions, errors?: FileSystemError[]) {
    return this.head(options, errors);
  }

  public toString = () => `${this.fs.repository}:${this.path}`;

  public toURL(options?: URLOptions): Promise<string>;
  public toURL(
    options?: URLOptions,
    errors?: FileSystemError[]
  ): Promise<string | null> {
    return this.fs.getURL(this.path, options, errors);
  }

  public abstract _copy(
    entry: Entry,
    options: CopyOptions,
    errors?: FileSystemError[]
  ): Promise<boolean>;
  public abstract _deleteExisting(
    option: DeleteOptions,
    errors?: FileSystemError[]
  ): Promise<boolean>;
  public abstract _validate(options?: HeadOptions): Promise<void>;
  public abstract head(options?: HeadOptions): Promise<Stats>;
  public abstract head(
    options?: HeadOptions,
    errors?: FileSystemError[]
  ): Promise<Stats | null>;

  protected async $delete(
    options: DeleteOptions,
    errors?: FileSystemError[]
  ): Promise<boolean> {
    const result = await this._beforeDelete(options);
    if (result != null) {
      return result;
    }

    try {
      await this._validate(options);
      return this._deleteExisting(options, errors);
    } catch (e) {
      if (isFileSystemError(e) && e.name === NotFoundError.name) {
        if (options.onNotExist === NotExistAction.Error) {
          throw e;
        }
        return false;
      } else {
        throw e;
      }
    }
  }

  protected async _afterDelete(
    result: boolean,
    options: DeleteOptions,
    error?: FileSystemError
  ) {
    const fs = this.fs;
    const afterDelete = fs.options.hook?.afterDelete;
    if (afterDelete && !options.ignoreHook) {
      await afterDelete(fs.repository, this.path, options, result, error);
    }
  }

  protected _beforeDelete(options: DeleteOptions) {
    const fs = this.fs;
    const beforeDelete = fs.options.hook?.beforeDelete;
    if (beforeDelete && !options.ignoreHook) {
      return beforeDelete(fs.repository, this.path, options);
    }
    return null;
  }

  protected _createError(name: string, params?: ErrorParams) {
    return createError({
      name,
      repository: this.fs.repository,
      path: this.path,
      ...params,
    });
  }

  protected _createNoModificationAllowedError(params?: ErrorParams) {
    return this._createError(NoModificationAllowedError.name, params);
  }

  protected _createNotFoundError(params?: ErrorParams) {
    return this._createError(NotFoundError.name, params);
  }

  protected _createNotReadableError(params?: ErrorParams) {
    return this._createError(NotReadableError.name, params);
  }

  protected _createTypeMismatchError(params?: ErrorParams) {
    return this._createError(TypeMismatchError.name, params);
  }

  protected async _handleNoModificationAllowedError(
    params: ErrorParams,
    errors?: FileSystemError[],
    callback?: (e: FileSystemError) => Promise<void>
  ) {
    const error = this._createNoModificationAllowedError(params);
    return this.fs._handleFileSystemError(error, errors, callback);
  }

  protected _handleNotFoundError(
    params: ErrorParams,
    errors?: FileSystemError[],
    callback?: (e: FileSystemError) => Promise<void>
  ) {
    const error = this._createNotFoundError(params);
    return this.fs._handleFileSystemError(error, errors, callback);
  }

  protected _handleNotReadableError(
    params: ErrorParams,
    errors?: FileSystemError[],
    callback?: (e: FileSystemError) => Promise<void>
  ) {
    const error = this._createNotReadableError(params);
    return this.fs._handleFileSystemError(error, errors, callback);
  }

  protected async _handleTypeMismatchError(
    params: ErrorParams,
    errors?: FileSystemError[],
    callback?: (e: FileSystemError) => Promise<void>
  ) {
    const error = this._createTypeMismatchError(params);
    return this.fs._handleFileSystemError(error, errors, callback);
  }
}
