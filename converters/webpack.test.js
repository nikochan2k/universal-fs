/* eslint-disable */
const glob = require("glob");

const entries = glob.sync("./lib/**/*.js");
const entryMap = {};
for (const entry of entries) {
  let name = entry.substring(6);
  name = name.replace(/\.js$/, "");
  entryMap[name] = entry;
}

module.exports = {
  mode: "development",
  entry: entryMap,
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
