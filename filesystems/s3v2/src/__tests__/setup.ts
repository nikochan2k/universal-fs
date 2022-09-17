import { ExistsAction, NoParentAction, NotExistAction } from "univ-fs";
import { S3FileSystem } from "../S3FileSystem";
import config from "./secret.json";

export const fs = new S3FileSystem("univ-fs-test", "test", config);

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
