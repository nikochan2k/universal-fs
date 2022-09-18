import { testAll } from "univ-fs/lib/__tests__/head";
import { fs, setup } from "./setup-nodir";

testAll(fs, { setup });
