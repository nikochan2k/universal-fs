import { testAll } from "univ-fs/commonjs/__tests__/list";
import { NodeFileSystem } from "../NodeFileSystem";
import { getRootDir } from "./setup";

const fs = new NodeFileSystem(getRootDir());
testAll(fs);
