import { AbstractDirectory, EntryType, Item, joinPaths } from "univ-fs";
import { WnfsFileSystem } from "./WnfsFileSystem";

export class WnfsDirectory extends AbstractDirectory {
  constructor(private wfs: WnfsFileSystem, path: string) {
    super(wfs, path);
  }

  public async _doDelete(): Promise<void> {
    if (this.path === "/") {
      return;
    }
    const { parent, name } = await this.wfs._getParent(this.path);
    await parent.removeEntry(name);
  }

  public async _doList(): Promise<Item[]> {
    const directoryHandle = await this._getDirectoryHandle(false);
    const items: Item[] = [];
    const entries = directoryHandle.entries();
    let result = await entries.next();
    while (!result.done) {
      const [name, handle] = result.value;
      items.push({
        path: joinPaths(this.path, name),
        type: handle.kind === "file" ? EntryType.File : EntryType.Directory,
      });
      result = await entries.next();
    }
    return items;
  }

  public async _doMkcol(): Promise<void> {
    if (this.path === "/") {
      return;
    }
    await this._getDirectoryHandle(true);
  }

  private async _getDirectoryHandle(create: boolean) {
    if (this.path === "/") {
      return this.wfs._getRoot();
    }
    const { parent, name } = await this.wfs._getParent(this.path);
    return parent.getDirectoryHandle(name, { create });
  }
}
