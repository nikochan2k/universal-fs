import { testAll } from "univ-fs/commonjs/__tests__/list";
import { fs, setup } from "./setup-nodir";

testAll(fs, { setup });
