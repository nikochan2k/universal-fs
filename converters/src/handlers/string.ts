import { AbstractHandler } from "../core";

export abstract class StringHandler extends AbstractHandler<string> {
  public empty(): Promise<string> {
    return Promise.resolve("");
  }

  protected _isEmpty(src: string): Promise<boolean> {
    return Promise.resolve(src.length === 0);
  }

  protected _validateSource(src: string): boolean {
    return typeof src === "string";
  }
}
