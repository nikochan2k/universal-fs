import { ConvertOptions, Data, DataType, ReturnData } from "univ-conv";
import { FileSystemError } from "./errors";

export const DEFAULT_STATS_KEYS = [
  "accessed",
  "created",
  "modified",
  "size",
  "etag",
];

type Primitive = boolean | number | string | null | undefined;

export interface Times {
  accessed?: number;
  created?: number;
  modified?: number;
}

export interface Stats extends Times {
  etag?: string;
  size?: number;

  [key: string]: Primitive;
}

export const EXCLUDE_PROP_NAMES = [
  "accessed",
  "created",
  "modified",
  "size",
  "etag",
];

export interface FileSystemOptions {
  defaultCopyOptions?: CopyOptions;
  defaultDeleteOptions?: DeleteOptions;
  defaultHeadOptions?: HeadOptions;
  defaultMkdirOptions?: MkcolOptions;
  defaultMoveOptions?: MoveOptions;
  defaultPatchOptions?: PatchOptions;
  defaultReadOptions?: ReadOptions;
  defaultWriteOptions?: WriteOptions;
  hook?: Hook;
}

export type Method = "GET" | "POST" | "PUT" | "DELETE";

export interface Options {
  ignoreHook?: boolean;
}

export enum NotExistAction {
  Error = "error",
  Ignore = "ignore",
}

export enum EntryType {
  File = "file" /** File */,
  Directory = "directory" /** Directory */,
}

export interface Item extends Stats {
  path: string;
  type?: EntryType;
}

export type ListOptions = Options;

export enum ExistsAction {
  Error = "error",
  Skip = "skip",
  Overwrite = "overwrite",
}

export enum NoParentAction {
  Error = "error",
  MakeParents = "make_parents",
}

export interface HeadOptions extends Options {
  type?: EntryType;
}

export type PatchOptions = HeadOptions;

export interface DeleteOptions extends Options {
  onNotExist: NotExistAction;
  recursive: boolean;
}

export interface MkcolOptions extends Options {
  onExists?: ExistsAction;
  onNoParent?: NoParentAction;
}

export interface ReadOptions extends Options, Partial<ConvertOptions> {}

export interface WriteOptions extends Options, Partial<ConvertOptions> {
  append?: boolean;
  onExists?: ExistsAction;
  onNotExist?: NotExistAction;
}

export interface MoveOptions
  extends HeadOptions,
    ReadOptions,
    WriteOptions,
    MkcolOptions {}

export interface CopyOptions
  extends HeadOptions,
    ReadOptions,
    WriteOptions,
    MkcolOptions {
  recursive?: boolean;
}

export interface URLOptions extends HeadOptions {
  expires?: number;
  method?: Method;
}

export interface Hook {
  afterDelete?: (
    repository: string,
    path: string,
    options: DeleteOptions,
    result: boolean,
    error?: FileSystemError
  ) => Promise<void>;
  afterGet?: (
    repository: string,
    path: string,
    options: ReadOptions,
    data: Data | null,
    error?: FileSystemError
  ) => Promise<void>;
  afterHead?: (
    repository: string,
    path: string,
    options: HeadOptions,
    stats: Stats | null,
    error?: FileSystemError
  ) => Promise<void>;
  afterList?: (
    repository: string,
    path: string,
    options: ListOptions,
    list: Item[] | null,
    error?: FileSystemError
  ) => Promise<void>;
  afterMkcol?: (
    repository: string,
    path: string,
    options: MkcolOptions,
    result: boolean,
    error?: FileSystemError
  ) => Promise<void>;
  afterPatch?: (
    repository: string,
    path: string,
    options: PatchOptions,
    result: boolean,
    error?: FileSystemError
  ) => Promise<void>;
  afterPost?: (
    repository: string,
    path: string,
    options: WriteOptions,
    result: boolean,
    error?: FileSystemError
  ) => Promise<void>;
  afterPut?: (
    repository: string,
    path: string,
    options: WriteOptions,
    result: boolean,
    error?: FileSystemError
  ) => Promise<void>;
  beforeDelete?: (
    repository: string,
    path: string,
    options: DeleteOptions
  ) => Promise<boolean | null>;
  beforeGet?: (
    repository: string,
    path: string,
    options: ReadOptions
  ) => Promise<Data | null>;
  beforeHead?: (
    repository: string,
    path: string,
    options: HeadOptions
  ) => Promise<Stats | null>;
  beforeList?: (
    repository: string,
    path: string,
    options: ListOptions
  ) => Promise<Item[] | null>;
  beforeMkcol?: (
    repository: string,
    path: string,
    options: MkcolOptions
  ) => Promise<boolean | null>;
  beforePatch?: (
    repository: string,
    path: string,
    props: Stats,
    options: PatchOptions
  ) => Promise<boolean | null>;
  beforePost?: (
    repository: string,
    path: string,
    data: Data,
    options: WriteOptions
  ) => Promise<boolean | null>;
  beforePut?: (
    repository: string,
    path: string,
    data: Data,
    options: WriteOptions
  ) => Promise<boolean | null>;
}

export interface FileSystem {
  options: FileSystemOptions;
  repository: string;

  copy(
    from: string,
    to: string,
    options?: CopyOptions,
    errors?: FileSystemError[]
  ): Promise<boolean>;
  cp(
    from: string,
    to: string,
    options?: CopyOptions,
    errors?: FileSystemError[]
  ): Promise<boolean>;
  del(
    path: string,
    options?: DeleteOptions,
    errors?: FileSystemError[]
  ): Promise<boolean>;
  delete(
    path: string,
    options?: DeleteOptions,
    errors?: FileSystemError[]
  ): Promise<boolean>;
  dir(path: string, options?: ListOptions): Promise<string[]>;
  dir(
    path: string,
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null>;
  getDirectory(path: string): Directory;
  getFile(path: string): File;
  getURL(path: string, options?: URLOptions): Promise<string>;
  getURL(
    path: string,
    options?: URLOptions,
    errors?: FileSystemError[]
  ): Promise<string | null>;
  hash(path: string, options?: ReadOptions): Promise<string>;
  hash(
    path: string,
    options?: ReadOptions,
    errors?: FileSystemError[]
  ): Promise<string | null>;
  head(path: string, options?: HeadOptions): Promise<Stats>;
  head(
    path: string,
    options?: HeadOptions,
    errors?: FileSystemError[]
  ): Promise<Stats | null>;
  list(path: string, options?: ListOptions): Promise<string[]>;
  list(
    path: string,
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null>;
  ls(path: string, options?: ListOptions): Promise<string[]>;
  ls(
    path: string,
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null>;
  mkcol(
    path: string,
    options?: MkcolOptions,
    errors?: FileSystemError[]
  ): Promise<boolean>;
  mkdir(
    path: string,
    options?: MkcolOptions,
    errors?: FileSystemError[]
  ): Promise<boolean>;
  move(
    from: string,
    to: string,
    options?: MoveOptions,
    errors?: FileSystemError[]
  ): Promise<boolean>;
  mv(
    from: string,
    to: string,
    options?: MoveOptions,
    errors?: FileSystemError[]
  ): Promise<boolean>;
  patch(
    path: string,
    props: Stats,
    options?: PatchOptions,
    errors?: FileSystemError[]
  ): Promise<boolean>;
  read<T extends DataType>(
    path: string,
    type?: T,
    options?: ReadOptions
  ): Promise<ReturnData<T>>;
  read<T extends DataType>(
    path: string,
    type?: T,
    options?: ReadOptions,
    errors?: FileSystemError[]
  ): Promise<ReturnData<T> | null>;
  readdir(path: string, options?: ListOptions): Promise<string[]>;
  readdir(
    path: string,
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null>;
  rm(
    path: string,
    options?: DeleteOptions,
    errors?: FileSystemError[]
  ): Promise<boolean>;
  stat(path: string, options?: HeadOptions): Promise<Stats>;
  stat(
    path: string,
    options?: HeadOptions,
    errors?: FileSystemError[]
  ): Promise<Stats | null>;
  supportDirectory(): boolean;
  write(path: string, data: Data, options?: WriteOptions): Promise<boolean>;
  write(
    path: string,
    data: Data,
    options?: WriteOptions,
    errors?: FileSystemError[]
  ): Promise<boolean | null>;
}

export interface Entry {
  fs: FileSystem;
  path: string;

  copy(
    to: Entry,
    options?: CopyOptions,
    errors?: FileSystemError[]
  ): Promise<boolean>;
  cp(
    to: Entry,
    options?: CopyOptions,
    errors?: FileSystemError[]
  ): Promise<boolean>;
  del(options?: DeleteOptions, errors?: FileSystemError[]): Promise<boolean>;
  delete(options?: DeleteOptions, errors?: FileSystemError[]): Promise<boolean>;
  getParent(): Directory;
  head(options?: HeadOptions): Promise<Stats>;
  head(
    options?: HeadOptions,
    errors?: FileSystemError[]
  ): Promise<Stats | null>;
  move(
    to: Entry,
    options?: MoveOptions,
    errors?: FileSystemError[]
  ): Promise<boolean>;
  mv(
    to: Entry,
    options?: MoveOptions,
    errors?: FileSystemError[]
  ): Promise<boolean>;
  patch(
    props: Stats,
    options?: PatchOptions,
    errors?: FileSystemError[]
  ): Promise<boolean>;
  remove(options?: DeleteOptions, errors?: FileSystemError[]): Promise<boolean>;
  rm(options?: DeleteOptions, errors?: FileSystemError[]): Promise<boolean>;
  stat(options?: HeadOptions): Promise<Stats>;
  stat(
    options?: HeadOptions,
    errors?: FileSystemError[]
  ): Promise<Stats | null>;
  toURL(options?: URLOptions): Promise<string>;
  toURL(
    options?: URLOptions,
    errors?: FileSystemError[]
  ): Promise<string | null>;
}

export interface Directory extends Entry {
  dir(options?: ListOptions): Promise<string[]>;
  dir(
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null>;
  list(options?: ListOptions): Promise<string[]>;
  list(
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null>;
  ls(options?: ListOptions): Promise<string[]>;
  ls(
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null>;
  mkcol(options?: MkcolOptions, errors?: FileSystemError[]): Promise<boolean>;
  mkdir(options?: MkcolOptions, errors?: FileSystemError[]): Promise<boolean>;
  readdir(options?: ListOptions): Promise<string[]>;
  readdir(
    options?: ListOptions,
    errors?: FileSystemError[]
  ): Promise<string[] | null>;
}

export interface File extends Entry {
  hash(options?: ReadOptions): Promise<string>;
  hash(
    options?: ReadOptions,
    errors?: FileSystemError[]
  ): Promise<string | null>;
  read<T extends DataType>(
    type?: T,
    options?: ReadOptions
  ): Promise<ReturnData<T>>;
  read<T extends DataType>(
    type?: T,
    options?: ReadOptions,
    errors?: FileSystemError[]
  ): Promise<ReturnData<T> | null>;
  write(
    data: Data,
    options?: WriteOptions,
    errors?: FileSystemError[]
  ): Promise<boolean>;
}

export interface Modification {
  data: Data;
  length?: number;
  start?: number;
}
