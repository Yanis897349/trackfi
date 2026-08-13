import { afterEach, describe, expect, it, vi } from "vitest"

import { overwriteGetLocale } from "../paraglide/runtime.js"
import { bootstrapLocalizedLanding } from "./landing"

afterEach(() => overwriteGetLocale(() => "en"))

describe("localized landing bootstrap", () => {
  it("redirects signed-in visitors to the localized dashboard", async () => {
    overwriteGetLocale(() => "fr")
    const redirect = vi.fn()
    const onPublic = vi.fn()

    await bootstrapLocalizedLanding({
      loadSession: async () => ({
        user: {
          email: "user@example.com",
          emailVerified: true,
          id: "user-id",
          locale: "fr",
          name: "Trackfi User",
          role: "user",
        },
      }),
      onPublic,
      redirect,
    })

    expect(redirect).toHaveBeenCalledWith("/fr/dashboard")
    expect(onPublic).not.toHaveBeenCalled()
  })

  it("renders the public landing when the session request fails", async () => {
    const onPublic = vi.fn()

    await bootstrapLocalizedLanding({
      loadSession: async () => {
        throw new Error("offline")
      },
      onPublic,
    })

    expect(onPublic).toHaveBeenCalledOnce()
  })
})
