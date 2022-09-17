import { NodeFileSystem } from "../NodeFileSystem";
import { testAll } from "univ-fs/lib/__tests__/head";
import { getRootDir } from "./setup";

const fs = new NodeFileSystem(getRootDir());
testAll(fs);
