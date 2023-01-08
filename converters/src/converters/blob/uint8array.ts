import type b2u from "../../converters/base64/uint8array.js";
import type u8h from "../../handlers/uint8array.js";
import {
  handleFileReader,
  hasArrayBufferOnBlob,
  hasReadAsArrayBufferOnBlob,
  hasStreamOnBlob,
} from "../../supports/Blob.js";
import { handleReadableStream } from "../../supports/WebStream.js";
import { AbstractConverter } from "../../UnivConv.js";
import { newBuffer } from "../../util.js";
import type b2b from "./base64.js";

class Blob_Uint8Array extends AbstractConverter<Blob, Uint8Array> {
  private b2u?: typeof b2u;
  private u8h?: typeof u8h;
  private b2b?: typeof b2b;

  public async _convert(src: Blob, bufferSize: number): Promise<Uint8Array> {
    if (hasArrayBufferOnBlob) {
      const ab = await src.arrayBuffer();
      return newBuffer(ab);
    }

    const size = src.size;
    if (hasReadAsArrayBufferOnBlob) {
      const u8 = newBuffer(src.size);
      for (let start = 0; start < size; start += bufferSize) {
        let end = start + bufferSize;
        if (size < end) end = size;
        const blobChunk = src.slice(start, end);
        const chunk = await handleFileReader(
          (reader) => reader.readAsArrayBuffer(blobChunk),
          (data) => data as ArrayBuffer
        );
        u8.set(newBuffer(chunk), start);
        start += chunk.byteLength;
      }
      return u8;
    }

    if (hasStreamOnBlob) {
      const readable = src.stream();
      const chunks: Uint8Array[] = [];
      await handleReadableStream(readable, (u8) => {
        chunks.push(u8);
        return Promise.resolve();
      });
      if (!this.u8h) {
        this.u8h = (await import("../../handlers/uint8array.js")).default;
      }
      return await this.u8h.merge(chunks, bufferSize);
    }

    if (!this.b2b) {
      this.b2b = (await import("./base64.js")).default;
    }
    const base64 = await this.b2b._convert(src, bufferSize);
    if (!this.b2u) {
      this.b2u = (
        await import("../../converters/base64/uint8array.js")
      ).default;
    }
    return await this.b2u._convert(base64);
  }
}

export default new Blob_Uint8Array();
