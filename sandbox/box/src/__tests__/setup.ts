import { ExistsAction, NoParentAction, NotExistAction } from "univ-fs";
import { BoxFileSystem } from "../BoxFileSystem";
import secret from "./secret-developer.json";

export const fs = new BoxFileSystem(
  "univ-fs-test",
  secret.boxAppSettings,
  secret.developerToken
);

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
