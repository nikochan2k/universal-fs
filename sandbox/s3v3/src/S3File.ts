import {
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";
import { Data, isBrowser } from "univ-conv";
import {
  AbstractFile,
  createMetadata,
  ReadOptions,
  Stats,
  WriteOptions,
} from "univ-fs";
import { S3FileSystem } from "./S3FileSystem";

export class S3File extends AbstractFile {
  constructor(private s3fs: S3FileSystem, path: string) {
    super(s3fs, path);
  }

  public async _doDelete(): Promise<void> {
    const s3fs = this.s3fs;
    const path = this.path;

    try {
      const cmd = new DeleteObjectCommand(s3fs._createCommand(path, false));
      const client = await s3fs._getClient();
      await client.send(cmd);
    } catch (e) {
      throw s3fs._error(path, e, true);
    }
  }

  public async _doRead(_stats: Stats, options: ReadOptions): Promise<Data> {
    const length = options.length;
    const start = options.start;
    let range: string | undefined;
    if (typeof start === "number" || typeof length === "number") {
      const s = typeof start === "number" ? start : 0;
      const e = typeof length === "number" ? (s + length - 1).toString() : "";
      range = `bytes=${s}-${e}`;
    }

    const s3fs = this.s3fs;
    const path = this.path;
    const cmdIn: GetObjectCommandInput = s3fs._createCommand(path, false);
    if (range) {
      cmdIn.Range = range;
    }
    const cmd = new GetObjectCommand(cmdIn);

    try {
      const client = await s3fs._getClient();
      const obj = await client.send(cmd);
      return obj.Body || "";
    } catch (e) {
      throw s3fs._error(path, e, false);
    }
  }

  public async _doWrite(
    data: Data,
    stats: Stats | undefined,
    options: WriteOptions
  ): Promise<void> {
    const s3fs = this.s3fs;
    const path = this.path;

    try {
      const conv = await this._getConverter();
      let body: Readable | Blob | Uint8Array | string;
      if (
        conv.is("readable", data) ||
        conv.is("blob", data) ||
        conv.is("uint8array", data) ||
        conv.is("text", data, options)
      ) {
        body = data;
      } else if (isBrowser) {
        body = await conv.convert("blob", data, options);
      } else {
        body = await conv.convert("uint8array", data, options);
      }

      let metadata: { [key: string]: string } | undefined;
      if (stats) {
        metadata = createMetadata(stats);
      }

      const client = await s3fs._getClient();
      if (conv.is("readable", body)) {
        const upload = new Upload({
          client,
          params: {
            ...s3fs._createCommand(path, false),
            Body: body,
            Metadata: metadata,
          },
        });
        await upload.done();
      } else {
        const length = await conv.size(body);
        const cmd = new PutObjectCommand({
          ...s3fs._createCommand(path, false),
          Body: body,
          ContentLength: length,
          Metadata: metadata,
        });
        await client.send(cmd);
      }
    } catch (e) {
      throw s3fs._error(path, e, true);
    }
  }

  public supportAppend(): boolean {
    return false;
  }

  public supportRangeRead(): boolean {
    return true;
  }

  public supportRangeWrite(): boolean {
    return false;
  }
}
