import type b2u from "../../converters/base64/uint8array";
import type u8h from "../../handlers/uint8array";
import {
  handleFileReader,
  hasArrayBufferOnBlob,
  hasReadAsArrayBufferOnBlob,
  hasStreamOnBlob,
} from "../../supports/Blob";
import { handleReadableStream } from "../../supports/WebStream";
import { AbstractConverter } from "../../UnivConv";
import { DEFAULT_BUFFER_SIZE, newBuffer } from "../../util";
import type b2b from "./base64";

class Blob_Uint8Array extends AbstractConverter<Blob, Uint8Array> {
  private b2u?: typeof b2u;
  private u8h?: typeof u8h;
  private b2b?: typeof b2b;

  public async _convert(src: Blob, bufferSize?: number): Promise<Uint8Array> {
    if (hasArrayBufferOnBlob) {
      const ab = await src.arrayBuffer();
      return newBuffer(ab);
    }

    if (!bufferSize) bufferSize = DEFAULT_BUFFER_SIZE;

    const length = src.size;
    if (hasReadAsArrayBufferOnBlob) {
      const u8 = newBuffer(src.size);
      for (let start = 0; start < length; start += bufferSize) {
        let end = start + bufferSize;
        if (length < end) end = length;
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
      let index = 0;
      const end = src.size;
      await handleReadableStream(readable, (u8) => {
        chunks.push(u8);
        index += u8.byteLength;
        return Promise.resolve(index < end);
      });
      if (!this.u8h) {
        this.u8h = (await import("../../handlers/uint8array")).default;
      }
      return await this.u8h.merge(chunks, bufferSize);
    }

    if (!this.b2b) {
      this.b2b = (await import("./base64")).default;
    }
    const base64 = await this.b2b._convert(src, bufferSize);
    if (!this.b2u) {
      this.b2u = (await import("../../converters/base64/uint8array")).default;
    }
    return await this.b2u._convert(base64);
  }
}

export default new Blob_Uint8Array();
