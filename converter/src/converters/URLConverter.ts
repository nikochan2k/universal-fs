import type { Readable } from "stream";
import { DEFAULT_CONVERTER } from "../AnyConv";
import {
  AbstractConverter,
  ConvertOptions,
  Data,
  DataType,
  deleteStartLength,
  getStartEnd,
  Options,
} from "./AbstractConverter";
import {
  fileURLToReadable,
  getFileSize,
  isBrowser,
  isNode,
  toFileURL,
} from "./NodeUtil";
import { dataUrlToBase64 } from "./Util";

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

  public match(input: unknown, options: ConvertOptions): input is string {
    return typeof input === "string" && options.srcStringType === "url";
  }

  protected async _convert(
    input: Data,
    options: ConvertOptions
  ): Promise<string | undefined> {
    let url: string;
    const type = options.dstURLType;
    if (type === "file" && toFileURL) {
      const readable = await DEFAULT_CONVERTER.converterOf("readable").convert(
        input,
        options
      );
      url = await toFileURL(readable);
    } else if (type === "blob") {
      const blob = await DEFAULT_CONVERTER.converterOf("blob").convert(
        input,
        options
      );
      url = URL.createObjectURL(blob);
    } else {
      const base64 = await DEFAULT_CONVERTER.converterOf("base64").convert(
        input,
        options
      );
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
      return await DEFAULT_CONVERTER.converterOf("base64").size(base64);
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
      const converter = DEFAULT_CONVERTER.converterOf("readable");
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
      const converter = DEFAULT_CONVERTER.converterOf("readablestream");
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
      const merged = await DEFAULT_CONVERTER.converterOf("arraybuffer").merge(
        buffers,
        options
      );
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
      const readable = await fileURLToReadable(input);
      return await DEFAULT_CONVERTER.converterOf("readable").toArrayBuffer(
        readable,
        options
      );
    } else {
      const resp = await fetch(input);
      return await DEFAULT_CONVERTER.converterOf(
        "readablestream"
      ).toArrayBuffer(resp.body as ReadableStream<Uint8Array>, options);
    }
  }

  protected async _toBase64(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const u8 = await this.toUint8Array(input, options);
    return await DEFAULT_CONVERTER.converterOf("uint8array").toBase64(
      u8,
      deleteStartLength(options)
    );
  }

  protected async _toText(
    input: string,
    options: ConvertOptions
  ): Promise<string> {
    const ab = await this.toArrayBuffer(input, options);
    return DEFAULT_CONVERTER.converterOf("text").convert(
      ab,
      deleteStartLength(options)
    );
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
