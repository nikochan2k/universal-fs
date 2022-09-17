import * as fs from "fs";
import { AbstractDirectory, Item, joinPaths } from "univ-fs";
import { NodeFileSystem } from "./NodeFileSystem";

export class NodeDirectory extends AbstractDirectory {
  constructor(private nfs: NodeFileSystem, path: string) {
    super(nfs, path);
  }

  public _doDelete(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.rmdir(this.getFullPath(), (err) => {
        if (err) {
          reject(this.nfs._error(this.path, err, true));
        } else {
          resolve();
        }
      });
    });
  }

  public _doList(): Promise<Item[]> {
    return new Promise<Item[]>((resolve, reject) => {
      fs.readdir(this.getFullPath(), (err, names) => {
        if (err) {
          reject(this.nfs._error(this.path, err, false));
        } else {
          resolve(
            names.map((name) => {
              return { path: joinPaths(this.path, name) };
            })
          );
        }
      });
    });
  }

  public _doMkcol(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.mkdir(this.getFullPath(), { recursive: true }, (err) => {
        if (err) {
          reject(this.nfs._error(this.path, err, true));
        } else {
          resolve();
        }
      });
    });
  }

  private getFullPath() {
    return joinPaths(this.fs.repository, this.path);
  }
}
