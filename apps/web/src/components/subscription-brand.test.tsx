import { fireEvent, render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { brandLogoUrl } from "../lib/brandfetch"
import { BrandLogo } from "./subscription-brand"

describe("subscription brand identity", () => {
  it("builds a Brandfetch logo URL from the website domain", () => {
    expect(
      brandLogoUrl(
        "https://www.example.com/pricing?plan=team",
        "brandfetch-test-client-id"
      )
    ).toBe(
      "https://cdn.brandfetch.io/domain/example.com/w/80/h/80/fallback/404/type/icon?c=brandfetch-test-client-id"
    )
    expect(brandLogoUrl("not-a-url", "brandfetch-test-client-id")).toBeNull()
    expect(brandLogoUrl("https://example.com", "")).toBeNull()
  })

  it("sends the application origin and falls back to the service initial", () => {
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
