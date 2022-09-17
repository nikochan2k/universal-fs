module.exports = {
  mode: "development",
  entry: {
    "basic.spec": "./lib/__tests__/basic.spec.js",
    "head.spec": "./lib/__tests__/head.spec.js",
    "list.spec": "./lib/__tests__/list.spec.js",
    "basic-arraybuffer.spec": "./lib/__tests__/basic-arraybuffer.spec.js",
    "head-arraybuffer.spec": "./lib/__tests__/head-arraybuffer.spec.js",
    "list-arraybuffer.spec": "./lib/__tests__/list-arraybuffer.spec.js",
    "basic-binary.spec": "./lib/__tests__/basic-binary.spec.js",
    "head-binary.spec": "./lib/__tests__/head-binary.spec.js",
    "list-binary.spec": "./lib/__tests__/list-binary.spec.js",
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
    },
  },
};
