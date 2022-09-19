import type { Readable } from "stream";
import {
  arrayBufferConverter,
  base64Converter,
  blobConverter,
  readableConverter,
  readableStreamConverter,
  textConverter,
  uint8ArrayConverter,
} from "./converters";
import {
  AbstractConverter,
  ConvertOptions,
  Data,
  DataType,
  deleteStartLength,
  getStartEnd,
  Options,
} from "./core";
import {
  dataUrlToBase64,
  fileURLToReadable,
  getFileSize,
  isBrowser,
  isNode,
  toFileURL,
} from "./util";

if (typeof fetch !== "function") {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  globalThis.fetch = require("node-fetch");
}

class URLConverter extends AbstractConverter<string> {
  public type: DataType = "url";

  public empty(): string {
    return "";
  }

  public typeEquals(input: unknown): input is string {
    return typeof input === "string";
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<string | undefined> {
    let url: string;
    const type = options.dstURLType;
    if (type === "file" && toFileURL) {
      const readable = await readableConverter().convert(input, options);
      url = await toFileURL(readable);
    } else if (type === "blob") {
      const blob = await blobConverter().convert(input, options);
      url = URL.createObjectURL(blob);
    } else {
      const base64 = await base64Converter().convert(input, options);
      url = "data:application/octet-stream;base64," + base64;
    }
    return url;
  }

  protected async _getSize(input: string): Promise<number> {
    if (input.startsWith("file:") && getFileSize) {
      return await getFileSize(input);
    } else if (input.startsWith("blob:") && isBrowser) {
      const res = await fetch(input);
      const blob = await res.blob();
      return blob.size;
    } else if (input.startsWith("data:")) {
      const base64 = dataUrlToBase64(input);
      return await base64Converter().getSize(base64);
    } else {
      const resp = await fetch(input, { method: "HEAD" });
      const str = resp.headers.get("Content-Length");
      const length = Math.trunc(str as any); // eslint-disable-line
      if (!isNaN(length)) {
        return length;
      }
    }
    throw new Error(`Cannot get size of ${input}`);
  }

  protected async _getStartEnd(
    input: string,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    const size = await this._getSize(input);
    return getStartEnd(options, size);
  }

  protected _isEmpty(input: string): boolean {
    return !/^(file|http|https|blob|data):/.test(input);
  }

  protected async _merge(urls: string[], options: Options): Promise<string> {
    if (isNode) {
      const converter = readableConverter();
      const readables: Readable[] = [];
      for (const url of urls) {
        const readable = await converter.convert(url);
        readables.push(readable);
      }
      const merged = await converter.merge(readables, options);
      return (await this._convert(merged, {
        ...options,
        dstURLType: "file",
      })) as string;
    } else if (isBrowser) {
      const converter = readableStreamConverter();
      const readables: ReadableStream<Uint8Array>[] = [];
      for (const url of urls) {
        const readable = await converter.convert(url, options);
        readables.push(readable);
      }
      const merged = await converter.merge(readables, options);
      return (await this._convert(merged, {
        ...options,
        dstURLType: "blob",
      })) as string;
    } else {
      const buffers: ArrayBuffer[] = [];
      for (const url of urls) {
        const buffer = await this.toArrayBuffer(url, options);
        buffers.push(buffer);
      }
      const merged = await arrayBufferConverter().merge(buffers, options);
      return (await this._convert(merged, {
        ...options,
        dstURLType: "data",
      })) as string;
    }
  }

  protected async _toArrayBuffer(
    input: string,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    if (input.startsWith("file:") && fileURLToReadable) {
      const readable = fileURLToReadable(input);
      return await readableConverter().toArrayBuffer(readable, options);
    } else {
      const resp = await fetch(input);
      return await readableStreamConverter().toArrayBuffer(
        resp.body as ReadableStream<Uint8Array>,
        options
      );
    }
  }

  protected async _toBase64(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    return await uint8ArrayConverter().toBase64(u8, deleteStartLength(options));
  }

  protected async _toText(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const ab = await this.toArrayBuffer(input, options);
    return textConverter().convert(ab, deleteStartLength(options));
  }

  protected async _toUint8Array(
    input: string,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const ab = await this.toArrayBuffer(input, options);
    return new Uint8Array(ab);
  }
}

export const INSTANCE = new URLConverter();
