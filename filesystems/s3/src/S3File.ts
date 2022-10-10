import { Readable } from "stream";
import { Data, isBrowser } from "univ-conv";
import { AbstractFile, createMetadata, Stats, WriteOptions } from "univ-fs";
import { S3FileSystem } from "./S3FileSystem";

export class S3File extends AbstractFile {
  constructor(private s3fs: S3FileSystem, path: string) {
    super(s3fs, path);
  }

  public async _doDelete(): Promise<void> {
    const s3fs = this.s3fs;
    const path = this.path;

    try {
      const client = await s3fs._getClient();
      await client.deleteObject(s3fs._createParams(path, false)).promise();
    } catch (e) {
      throw s3fs._error(path, e, true);
    }
  }

  public async _doRead(): Promise<Data> {
    const s3fs = this.s3fs;
    const path = this.path;

    try {
      const client = await s3fs._getClient();
      const obj = await client
        .getObject(s3fs._createParams(path, false))
        .promise();
      return (obj.Body as Data) || "";
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
    const conv = await this._getConverter();

    try {
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
        body = await conv.convert("uint8array", data);
      }

      let metadata: { [key: string]: string } | undefined;
      if (stats) {
        metadata = createMetadata(stats);
      }

      const client = await s3fs._getClient();
      const params = s3fs._createParams(path, false);
      if (conv.is("readable", body)) {
        await client
          .upload({ ...params, Body: body, Metadata: metadata })
          .promise();
      } else {
        const length = await conv.size(body as Data);
        await client
          .putObject({
            ...params,
            Body: body,
            ContentLength: length,
            Metadata: metadata,
          })
          .promise();
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
