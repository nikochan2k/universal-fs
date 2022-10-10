module.exports = {
  mode: "production",
  entry: {
    index: "./lib/index.js",
  },
  output: {
    filename: "univ-fs-s3.js",
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
