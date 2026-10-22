// Shared ESLint config for every TypeScript and JavaScript package in the repo.
import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    "**/node_modules/",
    "**/dist/",
    "**/coverage/",
    "**/.expo/",
    "**/.venv/",
  ]),
  eslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // React's own rules of hooks, plus the React Compiler's checks.
    files: ["apps/mobile/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat["recommended-latest"]],
  },
  {
    files: ["apps/mobile/tests/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.jest },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
