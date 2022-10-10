import { AbstractConverter, _ } from "./AbstractConverter";
import {
  ConvertOptions,
  Data,
  DataType,
  deleteStartLength,
  getStartEnd,
  Options,
} from "./core";
import {
  fileURLToReadable,
  getFileSize,
  isBrowser,
  isNode,
  newBufferFrom,
  toFileURL,
} from "./NodeUtil";
import { dataUrlToBase64 } from "./StringUtil";

export class URLConverter extends AbstractConverter<string> {
  public type: DataType = "url";

  constructor() {
    super();
    if (typeof fetch !== "function") {
      import("node-fetch")
        .then((module) => {
          globalThis.fetch = module.default as unknown as typeof fetch;
        })
        .catch((e) => console.warn(e));
    }
  }

  public empty(): string {
    return "";
  }

  public is(input: unknown, options: ConvertOptions): input is string {
    return typeof input === "string" && options.srcStringType === "url";
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<string> {
    let url: string;
    const type = options.dstURLType;
    if (type === "file" && toFileURL) {
      const readable = await _().convert("readable", input, options);
      url = await toFileURL(readable);
    } else if (type === "blob") {
      const blob = await _().convert("blob", input, options);
      url = URL.createObjectURL(blob);
    } else {
      const base64 = await _().convert("base64", input, options);
      url = "data:application/octet-stream;base64," + base64;
    }
    return url;
  }

  protected async _getStartEnd(
    input: string,
    options: ConvertOptions
  ): Promise<{ start: number; end: number | undefined }> {
    const size = await this._size(input);
    return getStartEnd(options, size);
  }

  protected _isEmpty(input: string): boolean {
    return !/^(file|http|https|blob|data):/.test(input);
  }

  protected async _merge(urls: string[], options: Options): Promise<string> {
    if (isNode) {
      const merged = await _().merge("readable", urls, options);
      return await this._convert(merged, {
        ...options,
        dstURLType: options.dstURLType || "file",
      });
    } else if (isBrowser) {
      const merged = await _().merge("readablestream", urls, options);
      return await this._convert(merged, {
        ...options,
        dstURLType: options.dstURLType || "blob",
      });
    } else {
      const merged = await _().merge("arraybuffer", urls, options);
      return await this._convert(merged, {
        ...options,
        dstURLType: "data",
      });
    }
  }

  protected async _size(input: string): Promise<number> {
    if (input.startsWith("file:") && getFileSize) {
      return await getFileSize(input);
    } else if (input.startsWith("blob:") && isBrowser) {
      const res = await fetch(input);
      const blob = await res.blob();
      return blob.size;
    } else if (input.startsWith("data:")) {
      const base64 = dataUrlToBase64(input);
      return await _()._of("base64").size(base64);
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

  protected async _toArrayBuffer(
    input: string,
    options: ConvertOptions
  ): Promise<ArrayBuffer> {
    if (input.startsWith("file:") && fileURLToReadable) {
      const readable = await fileURLToReadable(input);
      return await _()._of("readable").toArrayBuffer(readable, options);
    } else {
      const resp = await fetch(input);
      return await _()
        ._of("readablestream")
        .toArrayBuffer(resp.body as ReadableStream<Uint8Array>, options);
    }
  }

  protected async _toBase64(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this._toUint8Array(input, options);
    return await _()._of("uint8array").toBase64(u8, deleteStartLength(options));
  }

  protected async _toText(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const ab = await this._toArrayBuffer(input, options);
    return _()._of("text").convert(ab, deleteStartLength(options));
  }

  protected async _toUint8Array(
    input: string,
    options: ConvertOptions
  ): Promise<Uint8Array> {
    const ab = await this._toArrayBuffer(input, options);
    return newBufferFrom(ab);
  }
}
