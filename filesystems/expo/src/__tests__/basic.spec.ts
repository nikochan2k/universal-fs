import { ExpoFileSystem } from "../ExpoFileSystem";
import { testAll } from "univ-fs/lib/__tests__/basic";
import { getRootDir } from "./setup";

const fs = new ExpoFileSystem(getRootDir());
testAll(fs);
