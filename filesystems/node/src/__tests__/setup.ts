import { rmSync, statSync } from "fs";
import { tmpdir } from "os";
import { normalize } from "path";

export const getRootDir = () => {
  const tempDir = tmpdir();
  let rootDir = `${tempDir}/univ-fs-test`;
  rootDir = normalize(rootDir);
  try {
    statSync(rootDir);
    rmSync(rootDir, { recursive: true });
  } catch {}
  return rootDir;
};
