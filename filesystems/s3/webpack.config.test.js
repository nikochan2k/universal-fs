module.exports = {
  mode: "development",
  entry: {
    "basic.spec": "./lib/__tests__/basic.spec.js",
    "head.spec": "./lib/__tests__/head.spec.js",
    "list.spec": "./lib/__tests__/list.spec.js",
    "basic-nodir.spec": "./lib/__tests__/basic-nodir.spec.js",
    "head-nodir.spec": "./lib/__tests__/head-nodir.spec.js",
    "list-nodir.spec": "./lib/__tests__/list-nodir.spec.js",
  },
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
      util: false,
    },
  },
};
