import { afterEach, describe, expect, it } from "vitest"

import { formatCompactMoney } from "./currency"
import { formatDateOnly } from "./date"
import { m } from "./i18n"
import {
  deLocalizeUrl,
  getLocaleForUrl,
  localizeUrl,
  overwriteGetLocale,
} from "../paraglide/runtime.js"

afterEach(() => overwriteGetLocale(() => "en"))

describe("localized URLs and formatting", () => {
  it("round-trips canonical routes while preserving search parameters", () => {
    const french = localizeUrl("https://trackfi.test/dashboard?q=rent", {
      locale: "fr",
    })
    expect(french.pathname).toBe("/fr/dashboard")
    expect(french.search).toBe("?q=rent")
    expect(deLocalizeUrl(french).pathname).toBe("/dashboard")
    expect(getLocaleForUrl(french)).toBe("fr")
  })

  it("uses explicit French copy and locale formatting", () => {
    overwriteGetLocale(() => "fr")
    expect(m.auth_login_title()).toBe("Ravi de vous revoir")
    expect(formatDateOnly("2026-08-12")).toMatch(/août/)
    expect(formatCompactMoney(125_000, "EUR")).toContain("€")
  })

  it("selects locale-aware plural variants", () => {
    expect(m.calendar_renewal_count({ count: 1 })).toBe("1 renewal")
    expect(m.calendar_renewal_count({ count: 2 })).toBe("2 renewals")

    overwriteGetLocale(() => "fr")
    expect(m.calendar_category_count({ count: 1 })).toBe("1 catégorie")
    expect(m.calendar_category_count({ count: 2 })).toBe("2 catégories")
  })
})
