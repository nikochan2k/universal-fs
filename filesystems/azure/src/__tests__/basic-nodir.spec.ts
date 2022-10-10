import { testAll } from "univ-fs/commonjs/__tests__/basic";
import { fs, setup } from "./setup-nodir";

testAll(fs, { setup });
