import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jsdom",
  transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }] },
  moduleNameMapper: {
    "^@/lib/soroban$": "<rootDir>/src/__mocks__/lib/soroban.ts",
    "^@/lib/constants$": "<rootDir>/src/__mocks__/lib/constants.ts",
    "^@/i18n/(.*)$": "<rootDir>/src/__mocks__/i18n/$1",
    "^next-intl$": "<rootDir>/src/__mocks__/next-intl.ts",
    "^next-intl/(.*)$": "<rootDir>/src/__mocks__/next-intl/$1.ts",
    "^@/hooks/useTheme$": "<rootDir>/src/__mocks__/hooks/useTheme.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFiles: ["<rootDir>/jest.polyfills.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transformIgnorePatterns: ["node_modules/(?!(@walletconnect|uint8arrays)/)"],
};

export default config;
