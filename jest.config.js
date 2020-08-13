module.exports = {
    preset: "ts-jest",
    testPathIgnorePatterns: ["dist", "/node_modules"],
    globalSetup: "./setup/index.ts",
    testTimeout: 10000
  };