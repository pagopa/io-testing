module.exports = {
  preset: "ts-jest",
  testPathIgnorePatterns: ["dist", "/node_modules"],
  setupFiles: ["dotenv/config"],
  testTimeout: 10000
};
