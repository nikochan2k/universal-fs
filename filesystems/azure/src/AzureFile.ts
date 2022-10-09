import { Readable } from "stream";
import {
  arrayBufferConverter,
  Data,
  isBrowser,
  isNode,
  readableConverter,
  uint8ArrayConverter,
} from "univ-conv";
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
      if (isNode) {
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
    const converter = this._getConverter();

    try {
      const client = afs._getBlockBlobClient(path, false);
      if (readableConverter().is(data)) {
        const readable = await converter.toReadable(data, options);
        await client.uploadStream(readable);
      } else if (uint8ArrayConverter().is(data)) {
        const u8 = await converter.toUint8Array(data);
        await client.uploadData(u8);
      } else if (arrayBufferConverter().is(data)) {
        const ab = await converter.toArrayBuffer(data);
        await client.uploadData(ab);
      } else if (isBrowser) {
        const blob = await converter.toBlob(data, options);
        await client.uploadData(blob);
      } else {
        const u8 = await converter.toUint8Array(data, options);
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
