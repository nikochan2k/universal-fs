import { testAll } from "univ-fs/commonjs/__tests__/basic";
import { ExpoFileSystem } from "../ExpoFileSystem";
import { getRootDir } from "./setup";

const fs = new ExpoFileSystem(getRootDir());
testAll(fs);
