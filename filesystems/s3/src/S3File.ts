import { Readable } from "stream";
import {
  blobConverter,
  Data,
  hasBuffer,
  readableConverter,
  readableStreamConverter,
} from "univ-conv";
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
    const converter = this._getConverter();

    try {
      let body: Readable | ReadableStream<unknown> | Blob | Uint8Array;
      if (readableConverter().is(data)) {
        body = await converter.convert(data, "readable", options);
      } else if (readableStreamConverter().is(data)) {
        body = await converter.convert(data, "readablestream", options);
      } else if (blobConverter().is(data)) {
        body = await converter.convert(data, "blob", options);
      } else if (hasBuffer) {
        body = await converter.toBuffer(data);
      } else {
        body = await converter.toUint8Array(data);
      }

      let metadata: { [key: string]: string } | undefined;
      if (stats) {
        metadata = createMetadata(stats);
      }

      const client = await s3fs._getClient();
      const params = s3fs._createParams(path, false);
      if (readableConverter().is(body) || readableStreamConverter().is(body)) {
        const readable = converter.toReadable(body);
        await client
          .upload({ ...params, Body: readable, Metadata: metadata })
          .promise();
      } else {
        const length = await converter.getSize(body as Data);
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
