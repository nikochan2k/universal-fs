import { ListObjectsV2Request } from "aws-sdk/clients/s3";
import {
  AbstractDirectory,
  EntryType,
  Item,
  joinPaths,
  NotFoundError,
} from "univ-fs";
import { S3FileSystem } from "./S3FileSystem";

export class S3Directory extends AbstractDirectory {
  constructor(private s3fs: S3FileSystem, path: string) {
    super(s3fs, path);
  }

  public async _doList(): Promise<Item[]> {
    const s3FS = this.s3fs;
    const path = this.path;
    const items: Item[] = [];
    try {
      await this._listItems(
        {
          Bucket: s3FS.bucket,
          Delimiter: "/",
          Prefix: s3FS._getKey(path, true),
        },
        items
      );
      return items;
    } catch (e) {
      const err = s3FS._error(path, e, false);
      if (err.name === NotFoundError.name) {
        return items;
      }
      throw err;
    }
  }

  public async _doMkcol(): Promise<void> {
    const s3fs = this.s3fs;
    const path = this.path;
    const params = s3fs._createParams(path, true);

    try {
      const client = await s3fs._getClient();
      await client
        .putObject({
          ...params,
          Body: "",
          ContentLength: 0,
        })
        .promise();
    } catch (e) {
      throw s3fs._error(path, e, true);
    }
  }

  public async _doDelete(): Promise<void> {
    const s3fs = this.s3fs;
    const path = this.path;

    try {
      const client = await s3fs._getClient();
      await client.deleteObject(s3fs._createParams(path, true)).promise();
    } catch (e) {
      throw s3fs._error(path, e, true);
    }
  }

  private async _listItems(params: ListObjectsV2Request, items: Item[]) {
    const client = await this.s3fs._getClient();
    const data = await client.listObjectsV2(params).promise();
    // Directories
    for (const content of data.CommonPrefixes || []) {
      const prefix = content.Prefix;
      if (!prefix) {
        continue;
      }
      if (prefix === params.Prefix) {
        continue;
      }
      const parts = prefix.split("/");
      const name = parts[parts.length - 2] as string;
      const path = joinPaths(this.path, name);
      items.push({ path, type: EntryType.Directory });
    }
    // Files
    for (const content of data.Contents || []) {
      const key = content.Key;
      if (!key) {
        continue;
      }
      if (key === params.Prefix) {
        continue;
      }
      const parts = key.split("/");
      const name = parts[parts.length - 1] as string;
      const path = joinPaths(this.path, name);
      items.push({ path, type: EntryType.File });
    }

    if (data.IsTruncated) {
      params.ContinuationToken = data.NextContinuationToken;
      await this._listItems(params, items);
    }
  }
}
