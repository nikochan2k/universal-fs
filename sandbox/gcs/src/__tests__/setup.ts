import { ExistsAction, NoParentAction, NotExistAction } from "univ-fs";
import { GCSFileSystem } from "../GCSFileSystem";

export const fs = new GCSFileSystem("nikochan2k-test", "univ-fs-test", {
  keyFilename: "secret.json",
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
