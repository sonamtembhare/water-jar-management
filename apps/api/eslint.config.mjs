import { config as baseConfig } from "@repo/eslint-config/base";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "turbo/no-undeclared-env-vars": "off",
      // TypeScript types are stripped by @babel/eslint-parser, so these two
      // core rules cannot see type usage and produce false positives.
      // tsc --noEmit is the authoritative check for the api workspace.
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
];