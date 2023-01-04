const path = require("path");
const chromeDataDir = path.resolve(__dirname, ".chrome-karma");

const rimraf = require("rimraf");
rimraf.sync(chromeDataDir);

module.exports = function (config) {
  config.set({
    frameworks: ["jasmine"],
    plugins: ["karma-chrome-launcher", "karma-jasmine"],
    browsers: ["chrome_without_security"],
    customLaunchers: {
      chrome_without_security: {
        base: "ChromeHeadless",
        flags: [
          "--no-sandbox",
          "--disable-gpu",
          "--disable-web-security",
          "--disable-site-isolation-trials",
          "--allow-file-access-from-files",
        ],
        chromeDataDir,
      },
    },

    basePath: "mjs",

    files: [
      {
        pattern:
          "../../node_modules/base64-arraybuffer/dist/base64-arraybuffer.umd.js",
        watched: false,
      },
      {
        pattern: "**/*.?(web-)spec.js",
        watched: false,
        type: "module",
      },
      {
        pattern: "**/*.js",
        watched: false,
        included: false,
        served: true,
        type: "module",
      },
    ],

    client: { jasmine: { random: false } },
    singleRun: false,
  });
};
