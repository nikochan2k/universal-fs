import { ExistsAction, NoParentAction, NotExistAction } from "univ-fs";
import { WfsFileSystem } from "../WfsFileSystem";

export const fs = new WfsFileSystem("/isomorphic-fs-test", 50 * 1024 * 1024);

export const setup = async () => {
  const root = fs.getDirectory("/");
  await root.rm({
    onNotExist: NotExistAction.Ignore,
    recursive: true,
    ignoreHook: true,
  });
  await root.mkdir({
    onExists: ExistsAction.Skip,
    onNoParent: NoParentAction.Error,
    ignoreHook: true,
  });
};
