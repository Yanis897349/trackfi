import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { App } from "./app"
import { createTestRouter } from "./router"

describe("Trackfi web foundation", () => {
  it("renders the root route through the application providers", async () => {
    const { queryClient, router } = createTestRouter()

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", {
        name: "Finance tracking foundation",
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Foundation ready" })
    ).toBeDisabled()
  })
})
