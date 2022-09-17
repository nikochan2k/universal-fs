import { Converter } from "./core";

/* eslint-disable @typescript-eslint/no-explicit-any */
export class FalseConverter implements Converter<any> {
  public constructor(public key: string) {}

  public convert(): any {
    throw new Error("convert method not implemented: " + this.key);
  }

  public empty(): any {
    throw new Error("Method not implemented.");
  }

  public getSize(): Promise<number> {
    throw new Error("getSize method not implemented: " + this.key);
  }

  public getStartEnd(): Promise<{ start: number; end: number | undefined }> {
    throw new Error("Method not implemented.");
  }

  public merge(): Promise<any> {
    throw new Error("merge method not implemented: " + this.key);
  }

  public toArrayBuffer(): Promise<ArrayBuffer> {
    throw new Error("toArrayBuffer method not implemented: " + this.key);
  }

  public toBase64(): Promise<string> {
    throw new Error("toBase64 method not implemented: " + this.key);
  }

  public toText(): Promise<string> {
    throw new Error("toText method not implemented: " + this.key);
  }

  public toUint8Array(): Promise<Uint8Array> {
    throw new Error("toUint8Array method not implemented: " + this.key);
  }

  public typeEquals(_: unknown): _ is any {
    return false;
  }
}
