import { Duplex, Readable } from "stream";
import { AbstractConverter } from "../../UnivConv.js";

class Uint8Array_Readable extends AbstractConverter<Uint8Array, Readable> {
  public _convert(src: Uint8Array): Promise<Readable> {
    const duplex = new Duplex();
    duplex.push(src);
    duplex.push(null);
    return Promise.resolve(duplex);
  }
}

export default new Uint8Array_Readable();
