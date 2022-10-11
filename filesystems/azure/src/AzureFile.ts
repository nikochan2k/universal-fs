import { Readable } from "stream";
import { Data, hasReadableStream } from "univ-conv";
import {
  AbstractFile,
  createMetadata,
  ReadOptions,
  Stats,
  WriteOptions,
} from "univ-fs";
import { AzureFileSystem } from "./AzureFileSystem";

export class AzureFile extends AbstractFile {
  constructor(private afs: AzureFileSystem, path: string) {
    super(afs, path);
  }

  public async _doDelete(): Promise<void> {
    const afs = this.afs;
    const path = this.path;

    try {
      const client = afs._getBlockBlobClient(path, false);
      await client.delete();
    } catch (e) {
      throw afs._error(path, e, true);
    }
  }

  public async _doRead(_stats: Stats, options: ReadOptions): Promise<Data> {
    const afs = this.afs;
    const path = this.path;

    try {
      const client = afs._getBlockBlobClient(path, false);
      const resp = await client.download(options.start, options.length);
      if (hasReadableStream) {
        const rs = resp.readableStreamBody;
        if (!rs) return "";
        return rs as Readable; // TODO
      } else {
        const blob = resp.blobBody;
        if (!blob) return "";
        return blob;
      }
    } catch (e) {
      throw afs._error(path, e, false);
    }
  }

  public async _doWrite(
    data: Data,
    stats: Stats | undefined,
    options: WriteOptions
  ): Promise<void> {
    const afs = this.afs;
    const path = this.path;

    try {
      const conv = await this._getConverter();
      const client = afs._getBlockBlobClient(path, false);
      if (conv.is("readable", data)) {
        await client.uploadStream(data);
      } else if (
        conv.is("uint8array", data) ||
        conv.is("arraybuffer", data) ||
        conv.is("blob", data)
      ) {
        await client.uploadData(data);
      } else {
        const u8 = await conv.convert("uint8array", data, options);
        await client.uploadData(u8);
      }

      if (stats) {
        const metadata = createMetadata(stats);
        await client.setMetadata(metadata);
      }
    } catch (e) {
      throw afs._error(path, e, true);
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
