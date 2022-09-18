import { ExistsAction, NoParentAction, NotExistAction } from "univ-fs";
import { AzureFileSystem } from "../AzureFileSystem";
import config from "./secret.json";

export const fs = new AzureFileSystem("univ-fs-test", "test-nodir", config, {
  canCreateDirectory: false,
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
