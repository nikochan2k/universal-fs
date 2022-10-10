import {
  deleteAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from "expo-file-system";
import { Data, EMPTY_UINT8_ARRAY } from "univ-conv";
import {
  AbstractFile,
  joinPaths,
  NoModificationAllowedError,
  NotReadableError,
  ReadOptions,
  Stats,
  WriteOptions,
} from "univ-fs";
import { ExpoFileSystem } from "./ExpoFileSystem";

export class ExpoFile extends AbstractFile {
  private readonly uri: string;

  constructor(efs: ExpoFileSystem, path: string) {
    super(efs, path);
    this.uri = efs._resolveURL(path);
  }

  public async _doDelete(): Promise<void> {
    try {
      // eslint-disable-next-line
      await deleteAsync(this.uri);
    } catch (e) {
      throw this._createError({
        ...NoModificationAllowedError,
        e,
      });
    }
  }

  public async _doRead(stats: Stats, options: ReadOptions): Promise<Data> {
    const position = options.start ?? 0;
    const size = stats.size as number;
    let end = options.length ?? size;
    if (size < end) {
      end = size;
    }
    if (end <= position) {
      return EMPTY_UINT8_ARRAY;
    }
    const length = end - position;

    try {
      const base64 = await readAsStringAsync(this.uri, {
        encoding: "base64",
        position,
        length,
      });
      const conv = await this._getConverter();
      const u8 = await conv.convert("uint8array", base64, {
        srcStringType: "base64",
        bufferSize: options.bufferSize,
      });
      return u8;
    } catch (e) {
      throw this._createError({
        ...NotReadableError,
        e,
      });
    }
  }

  public async _doWrite(
    data: Data,
    _stats: Stats | undefined, // eslint-disable-line
    options: WriteOptions
  ): Promise<void> {
    try {
      const conv = await this._getConverter();
      const base64 = await conv.convert("base64", data, {
        srcStringType: options.srcStringType,
        bufferSize: options.bufferSize,
      });
      // eslint-disable-next-line
      await writeAsStringAsync(this.uri, base64, {
        encoding: "base64",
      });
    } catch (e) {
      throw this._createError({
        ...NoModificationAllowedError,
        e,
      });
    }
  }

  public _getFullPath() {
    return joinPaths(this.fs.repository, this.path);
  }

  public supportAppend(): boolean {
    return true;
  }

  public supportRangeRead(): boolean {
    return true;
  }

  public supportRangeWrite(): boolean {
    return true;
  }
}
