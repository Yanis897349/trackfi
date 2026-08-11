import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { TurnstileWidget } from "./turnstile-widget"

describe("TurnstileWidget", () => {
  it("requests a fresh token when its reset key changes", () => {
    const onTokenChange = vi.fn()
    const { rerender } = render(
      <TurnstileWidget onTokenChange={onTokenChange} resetKey={0} />
    )

    expect(onTokenChange).toHaveBeenLastCalledWith("test-token")

    rerender(<TurnstileWidget onTokenChange={onTokenChange} resetKey={1} />)

    expect(onTokenChange).toHaveBeenCalledTimes(2)
    expect(onTokenChange).toHaveBeenLastCalledWith("test-token")
  })
})
