// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Input } from "./input"

afterEach(cleanup)

describe("Input", () => {
  it("prevents Option shortcuts from typing into password fields", () => {
    render(<Input aria-label="Password" type="password" />)

    const accepted = fireEvent.keyDown(screen.getByLabelText("Password"), {
      altKey: true,
      key: "v",
    })

    expect(accepted).toBe(false)
  })

  it("preserves consumer keydown handlers", () => {
    const onKeyDown = vi.fn()
    render(
      <Input
        aria-label="Password"
        type="password"
        onKeyDown={onKeyDown}
      />
    )

    fireEvent.keyDown(screen.getByLabelText("Password"), {
      altKey: true,
      key: "v",
    })

    expect(onKeyDown).toHaveBeenCalledOnce()
  })

  it("does not suppress regular typing or Option shortcuts in other fields", () => {
    render(
      <>
        <Input aria-label="Password" type="password" />
        <Input aria-label="Name" />
      </>
    )

    expect(
      fireEvent.keyDown(screen.getByLabelText("Password"), { key: "v" })
    ).toBe(true)
    expect(
      fireEvent.keyDown(screen.getByLabelText("Name"), {
        altKey: true,
        key: "v",
      })
    ).toBe(true)
  })
})
