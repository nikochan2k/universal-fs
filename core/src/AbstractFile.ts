import { createHash } from "sha256-uint8array";
import {
  AnyConv,
  Data,
  DataType,
  EMPTY_UINT8_ARRAY,
  getAnyConv,
  handleReadable,
  handleReadableStream,
  isBrowser,
  ReturnData,
} from "univ-conv";
import { AbstractEntry } from "./AbstractEntry";
import { AbstractFileSystem } from "./AbstractFileSystem";
import {
  CopyOptions,
  Entry,
  EntryType,
  ExistsAction,
  File,
  HeadOptions,
  NotExistAction,
  ReadOptions,
  Stats,
  WriteOptions,
} from "./core";
import {
  FileSystemError,
  InvalidModificationError,
  isFileSystemError,
  NotFoundError,
  PathExistError,
} from "./errors";
import {
  createModifiedReadable,
  createModifiedReadableStream,
  modify,
} from "./mods";
import { toHex } from "./util";

export abstract class AbstractFile extends AbstractEntry implements File {
  constructor(fs: AbstractFileSystem, path: string) {
    super(fs, path);
  }

  public async _copy(
    toFile: Entry,
    options: CopyOptions,
    errors?: FileSystemError[]
  ): Promise<boolean> {
    const to = toFile as AbstractFile;
    try {
      await this._validate(options);

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

    // eslint-disable-next-line
    const data = await this._read(options, errors);
    if (data == null) {
      return false;
    }

    return to._write(data, options, errors);
  }

  public async _deleteExisting(): Promise<boolean> {
    await this._doDelete();
    return true;
  }

  public async _validate(options?: HeadOptions) {
    if (this.stats) {
      if (this.stats.size == null) {
        throw this._createTypeMismatchError({
          message: `"${this.path}" is not a file`,
        });
      }
    } else {
      await this.head(options);
    }
  }

  public async _write(
    data: Data,
    options?: WriteOptions,
    errors?: FileSystemError[]
  ): Promise<boolean> {
    options = { ...this.fs.defaultWriteOptions, ...options };
    if (options.append && options.start != null) {
      options.append = false;
      console.warn(
        "Set options.append to false because options.start is not null."
      );
    }

    try {
      try {
        await this._validate(options);
        if (options.onExists === ExistsAction.Skip) {
          return true;
        }
        if (options.onExists === ExistsAction.Error) {
          throw this._createError(PathExistError);
        }
      } catch (e) {
        if (isFileSystemError(e)) {
          if (e.name === NotFoundError.name) {
            if (options.onNotExist === NotExistAction.Error) {
              throw e;
            }
          } else {
            throw e;
          }
        } else {
          throw e;
        }
      }

      const result = await this.$write(data, options);
      if (this.stats) {
        await this._afterPut(options, result);
      } else {
        await this._afterPost(options, result);
      }
      return result;
    } catch (e) {
      const opts = options;
      await this._handleNoModificationAllowedError(
        { e },
        errors,
        async (error) => {
          if (this.stats) {
            await this._afterPut(opts, false, error);
          } else {
            await this._afterPost(opts, false, error);
          }
        }
      );
      return false;
    } finally {
      this.stats = undefined;
    }
  }

  public hash(options?: ReadOptions): Promise<string>;
  public hash(
    options?: ReadOptions,
    errors?: FileSystemError[]
  ): Promise<string | null>;
  public async hash(
    options?: ReadOptions,
    errors?: FileSystemError[]
  ): Promise<string | null> {
    options = { ...options };
    // eslint-disable-next-line
    const data = await this._read(options, errors);
    if (data == null) {
      return null;
    }

    const hash = createHash();
    const conv = await this._getConverter();
    if (conv.is("readable", data)) {
      await handleReadable(data, async (chunk) => {
        const buffer = await conv.convert("uint8array", chunk, {
          bufferSize: options?.bufferSize,
        });
        hash.update(buffer);
        return true;
      });
    } else if (conv.is("readablestream", data)) {
      await handleReadableStream(data, async (chunk) => {
        const u8 = await conv.convert("uint8array", chunk, {
          bufferSize: options?.bufferSize,
        });
        hash.update(u8);
        return true;
      });
    } else {
      const u8 = await conv.convert("uint8array", data);
      hash.update(u8);
    }

    return toHex(hash.digest());
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
    options = { ...options, type: EntryType.File };
    try {
      this.stats = await this.fs.head(this.path, options, errors);
    } catch (e) {
      this.stats = null;
      throw e;
    }
    return this.stats;
  }

  public async read<T extends DataType>(
    type?: T,
    options?: ReadOptions
  ): Promise<ReturnData<T>>;
  public async read<T extends DataType>(
    type?: T,
    options?: ReadOptions,
    errors?: FileSystemError[]
  ): Promise<ReturnData<T> | null>;
  public async read<T extends DataType>(
    type?: T,
    options?: ReadOptions,
    errors?: FileSystemError[]
  ): Promise<ReturnData<T> | null> {
    options = { ...this.fs.defaultReadOptions, ...options };
    const data = await this._read(options, errors);
    if (data === null) {
      return null;
    }
    if (type == null) {
      return data as ReturnData<T>;
    }
    const converter = await this._getConverter();
    return await converter.convert(type, data, options);
  }

  public async write(
    data: Data,
    options?: WriteOptions,
    errors?: FileSystemError[]
  ): Promise<boolean> {
    return await this._write(data, options, errors);
  }

  public abstract _doDelete(): Promise<void>;
  public abstract _doRead(stats: Stats, options: ReadOptions): Promise<Data>;
  public abstract _doWrite(
    data: Data,
    stats: Stats | undefined | null,
    options: WriteOptions
  ): Promise<void>;
  public abstract supportAppend(): boolean;
  public abstract supportRangeRead(): boolean;
  public abstract supportRangeWrite(): boolean;

  protected async $write(data: Data, options: WriteOptions): Promise<boolean> {
    const length = options.length;
    if (length === 0) {
      return true;
    }

    if (this.stats) {
      const result = await this._beforePut(data, options);
      if (result != null) {
        return result;
      }
    } else {
      const result = await this._beforePost(data, options);
      if (result != null) {
        return result;
      }
    }

    const conv = await this._getConverter();
    const start = options.start;
    if (!this.supportAppend() && options.append) {
      options.append = false;
      const head = await this._read({ bufferSize: options.bufferSize });
      if (conv.is("readable", head) || conv.is("readable", data)) {
        data = await conv.merge("readable", [head, data]);
      } else if (
        conv.is("readablestream", head) ||
        conv.is("readablestream", data)
      ) {
        data = await conv.merge("readablestream", [head, data]);
      } else if (isBrowser) {
        data = await conv.merge("blob", [head, data]);
      } else {
        data = await conv.merge("uint8array", [head, data]);
      }
    } else if (
      !this.supportRangeWrite() &&
      (typeof start === "number" || typeof length === "number")
    ) {
      delete options.start;
      delete options.length;
      const src = await this._read({ bufferSize: options.bufferSize });
      if (conv.is("readable", src)) {
        data = await createModifiedReadable(src, { data, start, length });
      } else if (conv.is("readablestream", src)) {
        data = await createModifiedReadableStream(src, {
          data,
          start,
          length,
        });
      } else {
        data = await modify(src, { data, start, length });
      }
    }

    await this._doWrite(data, this.stats, options);
    return true;
  }

  protected async __read(options: ReadOptions): Promise<Data> {
    if (options.length === 0) {
      return EMPTY_UINT8_ARRAY;
    }

    await this._validate(options);
    const stats = this.stats as Stats;
    if (stats.size === 0) {
      return EMPTY_UINT8_ARRAY;
    }

    let data = await this._doRead(stats, options);
    if (
      !this.supportRangeRead() &&
      (typeof options?.start === "number" ||
        typeof options?.length === "number")
    ) {
      const conv = await this._getConverter();
      data = await conv.slice(data, options);
    }

    return data;
  }

  protected async _afterGet(
    options: ReadOptions,
    data: Data | null,
    error?: FileSystemError
  ) {
    const fs = this.fs;
    const afterGet = fs.options.hook?.afterGet;
    if (afterGet && !options.ignoreHook) {
      await afterGet(fs.repository, this.path, options, data, error);
    }
  }

  protected async _afterPost(
    options: WriteOptions,
    result: boolean,
    error?: FileSystemError
  ) {
    const fs = this.fs;
    const afterPost = fs.options.hook?.afterPost;
    if (afterPost && !options.ignoreHook) {
      await afterPost(fs.repository, this.path, options, result, error);
    }
  }

  protected async _afterPut(
    options: WriteOptions,
    result: boolean,
    error?: FileSystemError
  ) {
    const fs = this.fs;
    const afterPut = fs.options.hook?.afterPut;
    if (afterPut && !options.ignoreHook) {
      await afterPut(fs.repository, this.path, options, result, error);
    }
  }

  protected async _beforeGet(options: ReadOptions) {
    const fs = this.fs;
    const beforeGet = fs.options.hook?.beforeGet;
    if (beforeGet && !options.ignoreHook) {
      return await beforeGet(fs.repository, this.path, options);
    }
    return null;
  }

  protected async _beforePost(data: Data, options: WriteOptions) {
    const fs = this.fs;
    const beforePost = fs.options.hook?.beforePost;
    if (beforePost && !options.ignoreHook) {
      await beforePost(fs.repository, this.path, data, options);
    }
  }

  protected async _beforePut(data: Data, options: WriteOptions) {
    const fs = this.fs;
    const beforePut = fs.options.hook?.beforePut;
    if (beforePut && !options.ignoreHook) {
      await beforePut(fs.repository, this.path, data, options);
    }
  }

  protected _getConverter(): Promise<AnyConv> {
    return getAnyConv();
  }

  protected async _read(options: ReadOptions): Promise<Data>;
  protected async _read(
    options: ReadOptions,
    errors?: FileSystemError[]
  ): Promise<Data | null>;
  protected async _read(
    options: ReadOptions,
    errors?: FileSystemError[]
  ): Promise<Data | null> {
    try {
      let data = await this._beforeGet(options);
      if (data) {
        return data;
      }

      data = await this.__read(options);
      await this._afterGet(options, data);
      return data;
    } catch (e) {
      const opts = options;
      await this._handleNotReadableError({ e }, errors, async (error) => {
        await this._afterGet(opts, null, error);
      });
      return null;
    }
  }
}
