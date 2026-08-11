import query from "@tanstack/eslint-plugin-query"
import { defineConfig } from "eslint/config"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"

import base from "./base.js"

const queryRecommended = query.configs["flat/recommended"]

export default defineConfig(
  ...base,
  ...(Array.isArray(queryRecommended) ? queryRecommended : [queryRecommended]),
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
          allowExportNames: ["Route", "buttonVariants"],
        },
      ],
    },
  }
)
