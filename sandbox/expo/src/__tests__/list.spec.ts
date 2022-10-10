import { testAll } from "univ-fs/commonjs/__tests__/list";
import { ExpoFileSystem } from "../ExpoFileSystem";
import { getRootDir } from "./setup";

const fs = new ExpoFileSystem(getRootDir());
testAll(fs);
