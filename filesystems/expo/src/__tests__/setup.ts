import { rmdirSync } from "fs";
import { tmpdir } from "os";
import { normalize } from "path";

export const getRootDir = () => {
  const tempDir = tmpdir();
  let rootDir = `${tempDir}/univ-fs-test`;
  rootDir = normalize(rootDir);
  rmdirSync(rootDir, { recursive: true });
  return rootDir;
};
