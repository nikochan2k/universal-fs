import type { Readable } from "stream";
import { Variant } from "../../../core.js";
import { handleReadable } from "../../NodeStream.js";
import { AbstractConverter } from "../../../UnivConv.js";

export abstract class ReadableConverter<
  DT extends Variant
> extends AbstractConverter<Readable, DT> {
  public async _convert(src: Readable): Promise<DT> {
    if (src.readableEncoding) {
      throw new Error(`Do not set encoding: ${src.readableEncoding}`);
    }
    const chunks: Buffer[] = [];
    await handleReadable(src, (chunk) => chunks.push(chunk));
    const buffer = Buffer.concat(chunks);
    return this._convertBuffer(buffer);
  }

  protected abstract _convertBuffer(buffer: Buffer): DT;
}
