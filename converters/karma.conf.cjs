const path = require("path");
const chromeDataDir = path.resolve(__dirname, ".chrome-karma");

const rimraf = require("rimraf");
rimraf.sync(chromeDataDir);

module.exports = function (config) {
  config.set({
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

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: "mjs",

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["jasmine"],

    // list of files / patterns to load in the browser
    // Here I'm including all of the the Jest tests which are all under the __tests__ directory.
    // You may need to tweak this patter to find your test files/
    files: [
      {
        pattern: "**/*.spec.js",
        watched: false,
        type: "module",
      },
      {
        pattern: "**/*.web-spec.js",
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
