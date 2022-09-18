import { AbstractEntry } from "./AbstractEntry";
import { AbstractFile } from "./AbstractFile";
import { AbstractFileSystem } from "./AbstractFileSystem";
import {
  CopyOptions,
  DeleteOptions,
  Directory,
  Entry,
  EntryType,
  ExistsAction,
  HeadOptions,
  Item,
  ListOptions,
  MkcolOptions,
  NoParentAction,
  Stats,
} from "./core";
import {
  FileSystemError,
  InvalidModificationError,
  isFileSystemError,
  NotFoundError,
  PathExistError,
} from "./errors";
import { getName, joinPaths, normalizePath } from "./util";

export abstract class AbstractDirectory
  extends AbstractEntry
  implements Directory
{
  constructor(fs: AbstractFileSystem, path: string) {
    super(fs, path);
  }

  public async _copy(
    toDir: Entry,
    options: CopyOptions,
    errors?: FileSystemError[]
  ): Promise<boolean> {
    if (this.stats) {
      await this.stat(options);
    }

    const fromItems = await this._list(options, errors);
    if (!fromItems) {
      return false;
    }

    const to = toDir as AbstractDirectory;
    try {
      await to._validate(options);
      if (options.onExists === ExistsAction.Skip) {
        return true;
      }
      if (options.onExists === ExistsAction.Error) {
        await this.fs._handleError(
          {
            ...InvalidModificationError,
            path: this.path,
            from: this.path,
            to: to.path,
          },
          errors
        );
        return false;
      }
    } catch (e) {
      if (isFileSystemError(e)) {
        if (e.name !== NotFoundError.name) {
          throw e;
        }
      } else {
        throw e;
      }
    }

    let result = await to.mkcol(options, errors);
    if (!result) {
      return false;
    }

    if (!options.recursive) {
      return true;
    }

    const fs = this.fs;
    for (const fromItem of fromItems) {
      const fromPath = fromItem.path;
      const fromEntry = await fs.getEntry(
        fromPath,
        {
          type: fromItem.type,
          ignoreHook: options.ignoreHook,
        },
        errors
      );
      const name = getName(fromPath);
      const toPath = joinPaths(to.path, name);
      let copyResult: boolean;
      if (fromEntry instanceof AbstractFile) {
        const toEntry = fs.getFile(toPath);
        copyResult = await fromEntry._copy(
          toEntry,
          { ...options, type: EntryType.File },
          errors
        );
      } else if (fromEntry instanceof AbstractDirectory) {
        const toEntry = fs.getDirectory(toPath);
        copyResult = await fromEntry._copy(
          toEntry,
          { ...options, type: EntryType.Directory },
          errors
        );
      } else {
        continue;
      }
      result = copyResult && result;
    }

    return result;
  }

  public async _deleteExisting(
    options: DeleteOptions,
    errors?: FileSystemError[]
  ): Promise<boolean> {
    let result = true;
    if (options.recursive) {
      const children = await this._list(options, errors);
      if (!children) {
        return false;
      }

      for (const child of children) {
        const childEntry = await this.fs.getEntry(
          child.path,
          {
            type: child.type,
            ignoreHook: options.ignoreHook,
          },
          errors
        );
        if (!childEntry) {
          result = false;
          continue;
        }
        result = (await childEntry.delete(options, errors)) && result;
      }
    }

    if (result) {
      await this._doDelete();
    }

    return result;
  }

  public async _validate(options?: HeadOptions) {
    if (this.stats) {
      if (this.stats.size != null) {
        throw this._createTypeMismatchError({
          message: `"${this.path}" is not a directory`,
        });
      }
    } else {
      await this.head(options);
    }
  }

  public dir(options?: ListOptions): Promise<string[]>;
  public dir(
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null>;
  public async dir(
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null> {
    return await this.list(options, errors);
  }

  public head(options?: HeadOptions): Promise<Stats>;
  public head(
    options?: HeadOptions,
    errors?: FileSystemError[]
  ): Promise<Stats | null>;
  public async head(
    options?: HeadOptions,
    errors?: FileSystemError[]
  ): Promise<Stats | null> {
    if (!this.fs.supportDirectory()) {
      this.stats = {};
      return this.stats;
    }

    options = { ...options, type: EntryType.Directory };
    this.stats = await this.fs.head(this.path, options, errors);
    return this.stats;
  }

  public async list(options?: ListOptions): Promise<string[]>;
  public async list(
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null>;
  public async list(
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null> {
    options = { ...options };
    const list = await this._list(options, errors);
    if (!list) {
      return null;
    }
    return list.map((item) => item.path);
  }

  public ls(options?: ListOptions): Promise<string[]>;
  public ls(
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null>;
  public async ls(
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null> {
    return await this.list(options, errors);
  }

  public async mkcol(
    options?: MkcolOptions,
    errors?: FileSystemError[]
  ): Promise<boolean> {
    options = { ...this.fs.defaultMkcolOptions, ...options };

    try {
      const result = await this.$mkcol(options);
      await this._afterMkcol(options, result);
      return result;
    } catch (e) {
      const opts = options;
      await this._handleNoModificationAllowedError(
        { e },
        errors,
        async (error) => {
          await this._afterMkcol(opts, false, error);
        }
      );
      return false;
    } finally {
      this.stats = undefined;
    }
  }

  public mkdir = (options?: MkcolOptions) => this.mkcol(options);

  public readdir(options?: ListOptions): Promise<string[]>;
  public readdir(
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null>;
  public async readdir(
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null> {
    return await this.list(options, errors);
  }

  public abstract _doDelete(): Promise<void>;
  public abstract _doList(): Promise<Item[]>;
  public abstract _doMkcol(): Promise<void>;

  protected async $list(options: ListOptions): Promise<Item[]> {
    await this._validate(options);

    const list = await this._doList();
    for (const item of list) {
      if (item.path.endsWith("/")) {
        if (!item.type) {
          item.type = EntryType.Directory;
        }
      }
      item.path = normalizePath(item.path);
    }

    return list;
  }

  protected async $mkcol(options: MkcolOptions): Promise<boolean> {
    if (!this.fs.supportDirectory()) {
      return true;
    }

    if (this.path !== "/") {
      const parent = this.getParent();
      try {
        await parent.head({
          type: EntryType.Directory,
          ignoreHook: options?.ignoreHook,
        });
      } catch (e) {
        if (isFileSystemError(e) && e.name === NotFoundError.name) {
          if (options.onNoParent === NoParentAction.Error) {
            throw e;
          }
          if (parent.path !== "/") {
            await parent.mkcol(options);
          }
        }
      }
    }

    try {
      await this._validate(options);
      if (options.onExists === ExistsAction.Error) {
        throw this._createError({
          ...PathExistError,
          message: `"${this.path}" has already existed`,
        });
      }
      return true;
    } catch (e) {
      if (isFileSystemError(e)) {
        if (e.name !== NotFoundError.name) {
          throw e;
        }
      } else {
        throw e;
      }
    }

    await this._doMkcol();
    return true;
  }

  protected async _afterList(
    options: ListOptions,
    list: Item[] | null,
    error?: FileSystemError
  ) {
    const fs = this.fs;
    const afterList = fs.options.hook?.afterList;
    if (afterList && !options.ignoreHook) {
      await afterList(fs.repository, this.path, options, list, error);
    }
  }

  protected async _afterMkcol(
    options: MkcolOptions,
    result: boolean,
    error?: FileSystemError
  ) {
    const fs = this.fs;
    const afterMkcol = fs.options.hook?.afterMkcol;
    if (afterMkcol && !options.ignoreHook) {
      await afterMkcol(fs.repository, this.path, options, result, error);
    }
  }

  protected async _beforeList(options: ListOptions) {
    const fs = this.fs;
    const beforeList = fs.options.hook?.beforeList;
    if (beforeList && !options.ignoreHook) {
      return beforeList(fs.repository, this.path, options);
    }
    return null;
  }

  protected async _beforeMkcol(options: MkcolOptions) {
    const fs = this.fs;
    const beforeMkcol = fs.options.hook?.beforeMkcol;
    if (beforeMkcol && !options.ignoreHook) {
      return beforeMkcol(fs.repository, this.path, options);
    }
    return null;
  }

  protected async _list(
    options: ListOptions,
    errors?: FileSystemError[]
  ): Promise<Item[] | null> {
    try {
      let list = await this._beforeList(options);
      if (!list) {
        list = await this.$list(options);
      }

      await this._afterList(options, list);
      return list;
    } catch (e) {
      await this._handleNotReadableError({ e }, errors, async (error) => {
        await this._afterList(options, null, error);
      });
      return null;
    }
  }
}
