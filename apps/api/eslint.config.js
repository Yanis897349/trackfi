import { defineConfig, globalIgnores } from "eslint/config"

import config from "@trackfi/eslint-config/worker"

export default defineConfig(globalIgnores(["src/paraglide/**"]), ...config)
