import { Converter, DataType } from "./core.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
export class FalseConverter implements Converter<any> {
  public type: DataType = "unknown";

  public constructor(public key: string) {}

  public from(): any {
    throw new Error("convert method not implemented: " + this.key);
  }

  public empty(): any {
    throw new Error("Method not implemented.");
  }

  public getStartEnd(): Promise<{ start: number; end: number | undefined }> {
    throw new Error("Method not implemented.");
  }

  public is(_: unknown): _ is any {
    return false;
  }

  public merge(): Promise<any> {
    throw new Error("merge method not implemented: " + this.key);
  }

  public size(): Promise<number> {
    throw new Error("getSize method not implemented: " + this.key);
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
}
