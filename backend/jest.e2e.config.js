// Uctan uca testler: gercek backend container'i, PostgreSQL ve Mailpit gerektirir.
// Calistirma: npm run test:e2e  (ortami kendisi kurar ve kapatir)
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/e2e"],
  testMatch: ["**/*.e2e.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { diagnostics: { warnOnly: false }, isolatedModules: true }],
  },
  globalSetup: "<rootDir>/e2e/globalSetup.ts",
  testTimeout: 60000,
};
