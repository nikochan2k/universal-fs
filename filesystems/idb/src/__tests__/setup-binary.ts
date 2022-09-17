import { ExistsAction, NoParentAction, NotExistAction } from "univ-fs";
import { IdbFileSystem } from "../IdbFileSystem";

export const fs = new IdbFileSystem("/isomorphic-fs-test", {
  storeType: "binary",
});

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
