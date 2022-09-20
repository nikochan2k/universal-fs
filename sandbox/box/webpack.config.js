module.exports = {
  mode: "production",
  entry: {
    index: "./lib/index.js",
  },
  output: {
    filename: "univ-fs-box.js",
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
