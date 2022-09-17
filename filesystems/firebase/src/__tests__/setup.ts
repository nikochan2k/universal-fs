import { ExistsAction, NoParentAction, NotExistAction } from "univ-fs";
import { FirebaseFileSystem } from "../FirebaseFileSystem";
import firebaseConfig from "./secret.json";

export const fs = new FirebaseFileSystem("nikochan2k-test", firebaseConfig);

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
