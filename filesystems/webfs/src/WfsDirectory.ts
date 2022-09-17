import { AbstractDirectory, EntryType, Item, joinPaths } from "univ-fs";
import { WfsFileSystem } from "./WfsFileSystem";

export class WfsDirectory extends AbstractDirectory {
  constructor(private wfs: WfsFileSystem, path: string) {
    super(wfs, path);
  }

  public async _doDelete(): Promise<void> {
    const wfs = this.wfs;
    const path = this.path;
    const repository = wfs.repository;
    const fullPath = joinPaths(repository, path);

    const fs = await this.wfs._getFS();
    return await new Promise<void>((resolve, reject) => {
      fs.root.getDirectory(
        fullPath,
        { create: false },
        (entry) => {
          const handle = (e: FileError) => reject(e);
          entry.remove(resolve, handle);
        },
        (e) => reject(e)
      );
    });
  }

  public async _doList(): Promise<Item[]> {
    const wfs = this.wfs;
    const path = this.path;
    const repository = wfs.repository;
    const fullPath = joinPaths(repository, path);

    const fs = await wfs._getFS();
    return await new Promise<Item[]>((resolve, reject) => {
      fs.root.getDirectory(
        fullPath,
        { create: false },
        (directory) => {
          const reader = directory.createReader();
          reader.readEntries(
            (entries) => {
              const list: Item[] = [];
              const from = repository.length;
              for (const entry of entries) {
                const path = entry.fullPath.substring(from);
                let item: Item;
                if (entry.isDirectory) {
                  item = { path, type: EntryType.Directory };
                } else {
                  item = { path, type: EntryType.File };
                }
                list.push(item);
              }
              resolve(list);
            },
            (e) => reject(e)
          );
        },
        (e) => reject(e)
      );
    });
  }

  public async _doMkcol(): Promise<void> {
    const wfs = this.wfs;
    const path = this.path;
    const repository = wfs.repository;
    const fullPath = joinPaths(repository, path);

    const fs = await wfs._getFS();
    return await new Promise<void>((resolve, reject) => {
      fs.root.getDirectory(
        fullPath,
        { create: true },
        () => resolve(),
        (e) => reject(e)
      );
    });
  }
}
