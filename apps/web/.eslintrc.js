/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@atm0s-media-sdk/eslint-config/next.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
};
