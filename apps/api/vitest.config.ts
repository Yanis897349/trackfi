import { cloudflareTest } from "@cloudflare/vitest-pool-workers"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          APP_ORIGIN: "http://localhost:5173",
          AUTH_BASE_URL: "http://localhost:8787",
          EMAIL_FROM: "Trackfi <hello@example.com>",
          ADMIN_EMAILS: "",
          BETTER_AUTH_SECRET: "",
          BRANDFETCH_API_TOKEN: "brandfetch-test-token",
          RESEND_API_KEY: "",
          TURNSTILE_SECRET_KEY: "",
        },
      },
    }),
  ],
})
