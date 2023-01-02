import { Readable } from "stream";
import { handleReadable } from "../../supports/NodeStream";
import { AbstractConverter } from "../../UnivConv";

class Readable_Binary extends AbstractConverter<Readable, string> {
  public async _convert(src: Readable): Promise<string> {
    const chunks: string[] = [];
    await handleReadable(src, (chunk) => {
      const binary = chunk.toString("binary");
      chunks.push(binary);
      return Promise.resolve();
    });
    return chunks.join("");
  }
}

export default new Readable_Binary();
