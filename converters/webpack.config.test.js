/* eslint-disable */
const glob = require("glob");

const entries = glob.sync("./commonjs/__tests__/**/*.spec.js");
const entryMap = {};
for (const entry of entries) {
  let name = entry.substring(21);
  name = name.replace(/[/\\]/g, "_");
  name = name.replace(/\.js$/, "");
  entryMap[name] = entry;
}
console.log(entryMap);

module.exports = {
  mode: "development",
  entry: entryMap,
  output: {
    filename: "[name].js",
    path: __dirname + "/dist",
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
};
