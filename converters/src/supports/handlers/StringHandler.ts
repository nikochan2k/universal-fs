import { AbstractHandler } from "../../core.js";

export abstract class StringHandler extends AbstractHandler<string> {
  public empty(): Promise<string> {
    return Promise.resolve("");
  }

  protected _isEmpty(src: string): Promise<boolean> {
    return Promise.resolve(src.length === 0);
  }

  protected _validateSource(src: unknown): src is string {
    return typeof src === "string";
  }
}
