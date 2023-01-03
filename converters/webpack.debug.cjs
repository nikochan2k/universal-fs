const glob = require("glob");

const testEntries = glob.sync("./mjs/__tests__/**/*debug*.js");
const moduleEntries1 = glob.sync("./mjs/converters/**/*.js");
const moduleEntries2 = glob.sync("./mjs/handlers/*.js");
const moduleEntries = [...moduleEntries1, ...moduleEntries2];
const moduleEntryMap = {};
for (const entry of moduleEntries) {
  let name = entry.substring(6);
  name = name.replace(/\.js$/, "");
  moduleEntryMap[name] = entry;
}

module.exports = {
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
