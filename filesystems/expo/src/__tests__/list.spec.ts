import { ExpoFileSystem } from "../ExpoFileSystem";
import { getRootDir } from "./setup";
import { testAll } from "univ-fs/lib/__tests__/list";

const fs = new ExpoFileSystem(getRootDir());
testAll(fs);
