import { testAll } from "univ-fs/lib/__tests__/list";
import { fs, setup } from "./setup-nodir";

testAll(fs, { setup });
