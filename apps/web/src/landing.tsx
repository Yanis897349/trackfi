import { StrictMode } from "react"
import { hydrateRoot } from "react-dom/client"

import "@trackfi/ui/globals.css"

import { WaitlistPage } from "./components/waitlist-page"
import { bootstrapLocalizedLanding } from "./lib/landing"

const rootElement = document.getElementById("root")

if (!rootElement) throw new Error("Root element was not found")

void bootstrapLocalizedLanding({
  onPublic: () =>
    hydrateRoot(
      rootElement,
      <StrictMode>
        <WaitlistPage />
      </StrictMode>
    ),
})
