import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"
import { fileURLToPath, URL } from "node:url"

const webPort = Number(process.env.WEB_PORT ?? 5173)

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  server: {
    port: webPort,
    strictPort: true,
  },
  preview: {
    port: webPort,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        app: fileURLToPath(new URL("./index.html", import.meta.url)),
        landing: fileURLToPath(new URL("./landing.html", import.meta.url)),
      },
    },
  },
  test: {
    environment: "jsdom",
    maxWorkers: 1,
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 15_000,
  },
})
