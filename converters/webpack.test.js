import glob from "glob";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testEntries1 = glob.sync("./mjs/__tests__/converters/**/*.spec.js");
const testEntries2 = glob.sync("./mjs/__tests__/converters/**/*.web-spec.js");
const testEntries3 = glob.sync("./mjs/__tests__/handlers/*.spec.js");
const testEntries4 = glob.sync("./mjs/__tests__/handlers/*.web-spec.js");
const testEntries = [
  ...testEntries1,
  ...testEntries2,
  ...testEntries3,
  ...testEntries4,
];

const moduleEntries1 = glob.sync("./mjs/converters/**/*.js");
const moduleEntries2 = glob.sync("./mjs/handlers/*.js");
const moduleEntries = [...moduleEntries1, ...moduleEntries2];
const moduleEntryMap = {};
for (const entry of moduleEntries) {
  let name = entry.substring(6);
  name = name.replace(/\.js$/, "");
  moduleEntryMap[name] = entry;
}

export default {
  mode: "development",
  entry: {
    "index.spec": testEntries,
    ...moduleEntryMap,
  },
  output: {
    filename: "[name].js",
    path: __dirname + "/dist",
    library: {
      type: "module",
    },
  },
  resolve: {
    fullySpecified: false,
    extensions: [".js"],
    fallback: {
      stream: false,
      fs: false,
      os: false,
      path: false,
      url: false,
    },
  },
  experiments: {
    outputModule: true,
  },
};
