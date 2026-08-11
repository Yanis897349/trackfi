import { fireEvent, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { brandfetchLogoUrl } from "../lib/brandfetch"
import { BrandLogo } from "./subscription-brand"

afterEach(() => vi.unstubAllEnvs())

describe("subscription brand identity", () => {
  it("builds an explicit, retina Brandfetch icon URL from the website domain", () => {
    expect(
      brandfetchLogoUrl(
        "https://www.example.com/pricing?plan=team",
        "client id",
        40
      )
    ).toBe(
      "https://cdn.brandfetch.io/domain/example.com/w/80/h/80/fallback/lettermark/type/icon?c=client%20id"
    )
    expect(brandfetchLogoUrl("not-a-url", "client-id")).toBeNull()
  })

  it("sends the origin referrer and falls back to the service initial", () => {
    vi.stubEnv("VITE_BRANDFETCH_CLIENT_ID", "client-id")
    const { container, getByText } = render(
      <BrandLogo name="Notion" websiteUrl="https://notion.so" />
    )
    const image = container.querySelector("img")!
    expect(image).toHaveAttribute("referrerpolicy", "origin")
    expect(image).toHaveClass("rounded-[22%]")
    expect(image.parentElement).toHaveClass("p-[15%]")
    fireEvent.error(image)
    expect(getByText("N")).toBeInTheDocument()
  })
})
