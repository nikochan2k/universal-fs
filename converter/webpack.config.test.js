module.exports = {
  mode: "development",
  entry: {
    "conv.spec": "./lib/__tests__/conv.spec.js",
    "common.spec": "./lib/__tests__/common.spec.js",
    "largefile.spec": "./lib/__tests__/largefile-web.js",
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
