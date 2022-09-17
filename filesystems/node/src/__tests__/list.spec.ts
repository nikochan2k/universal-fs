import { NodeFileSystem } from "../NodeFileSystem";
import { getRootDir } from "./setup";
import { testAll } from "univ-fs/lib/__tests__/list";

const fs = new NodeFileSystem(getRootDir());
testAll(fs);
