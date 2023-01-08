import { AbstractConverter } from "../../UnivConv.js";

class Uint8Array_ReadableStream extends AbstractConverter<
  Uint8Array,
  ReadableStream<Uint8Array>
> {
  public _convert(src: Uint8Array): Promise<ReadableStream<Uint8Array>> {
    return Promise.resolve(
      new ReadableStream<Uint8Array>({
        start: (controller) => {
          controller.enqueue(src);
        },
      })
    );
  }
}

export default new Uint8Array_ReadableStream();
