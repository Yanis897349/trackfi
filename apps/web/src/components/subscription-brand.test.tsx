import { fireEvent, render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { brandLogoUrl } from "../lib/brandfetch"
import { BrandLogo } from "./subscription-brand"

describe("subscription brand identity", () => {
  it("builds a Trackfi API logo URL from the website domain", () => {
    expect(
      brandLogoUrl(
        "https://www.example.com/pricing?plan=team",
        "https://api.trackfi.test"
      )
    ).toBe("https://api.trackfi.test/api/brands/logo?domain=example.com")
    expect(brandLogoUrl("not-a-url", "https://api.trackfi.test")).toBeNull()
  })

  it("sends credentials and falls back to the service initial", () => {
    const { container, getByText } = render(
      <BrandLogo name="Notion" websiteUrl="https://notion.so" />
    )
    const image = container.querySelector("img")!
    expect(image).toHaveAttribute("crossorigin", "use-credentials")
    expect(image).toHaveClass("rounded-[22%]")
    expect(image.parentElement).toHaveClass("p-[15%]")
    fireEvent.error(image)
    expect(getByText("N")).toBeInTheDocument()
  })
})
