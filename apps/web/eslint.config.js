import { defineConfig } from "eslint/config"

import config from "@trackfi/eslint-config/react"

export default defineConfig(...config, {
  files: ["src/routes/**/*.tsx"],
  rules: {
    "react-refresh/only-export-components": "off",
  },
})
