import { ConvertOptions } from "../../core.js";
import UNIV_CONV, { AbstractConverter } from "../../UnivConv.js";
import u2r from "../uint8array/readablestream.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
class Any_ReadableStream extends AbstractConverter<
  any,
  ReadableStream<Uint8Array>
> {
  public _convert(): Promise<ReadableStream<Uint8Array>> {
    throw new Error("Method not implemented.");
  }

  public override async convert(
    src: any,
    options?: ConvertOptions | undefined
  ): Promise<ReadableStream<Uint8Array>> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const u8 = await UNIV_CONV.convert(src, Uint8Array, options);
    return u2r._convert(u8);
  }
}

export default new Any_ReadableStream();
