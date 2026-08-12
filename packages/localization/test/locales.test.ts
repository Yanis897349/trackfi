import { describe, expect, it } from "vitest"

import en from "../messages/en.json"
import fr from "../messages/fr.json"
import { normalizeLocale, preferredLocale } from "../src/index"

describe("localization catalogs", () => {
  it("keeps English and French keys complete and non-empty", () => {
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort())
    expect(Object.values(en).every(Boolean)).toBe(true)
    expect(Object.values(fr).every(Boolean)).toBe(true)
  })

  it("normalizes supported browser and header locales", () => {
    expect(normalizeLocale("fr-FR")).toBe("fr")
    expect(normalizeLocale("de-DE")).toBe("en")
    expect(preferredLocale("fr-FR,fr;q=0.9,en;q=0.8")).toBe("fr")
  })
})
