import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@trackfi/ui/globals.css"

import { App } from "./app"
import { createAppRouter } from "./router"

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Root element was not found")
}

const { queryClient, router } = createAppRouter()

createRoot(rootElement).render(
  <StrictMode>
    <App queryClient={queryClient} router={router} />
  </StrictMode>
)
