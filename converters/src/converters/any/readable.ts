import { Readable } from "stream";
import { ConvertOptions } from "../../core.js";
import UNIV_CONV, { AbstractConverter } from "../../UnivConv.js";
import u2r from "../uint8array/readable.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
class Any_Readable extends AbstractConverter<any, Readable> {
  public _convert(): Promise<Readable> {
    throw new Error("Method not implemented.");
  }

  public override async convert(
    src: any,
    options?: ConvertOptions | undefined
  ): Promise<Readable> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const u8 = await UNIV_CONV.convert(src, Uint8Array, options);
    return u2r._convert(u8);
  }
}

export default new Any_Readable();
