import { Readable } from "stream";

export const toBuffer = (readable: Readable) => {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", (e) => reject(e));
    readable.on("data", (chunk) => chunks.push(chunk as Buffer));
  });
};

export const createReadable = (data: number[]) => {
  const buffer = Buffer.from(data);
  return new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });
};
