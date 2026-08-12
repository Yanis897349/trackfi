export const supportedLocales = ["en", "fr"] as const

export type Locale = (typeof supportedLocales)[number]

export const defaultLocale: Locale = "en"

export function isLocale(value: unknown): value is Locale {
  return supportedLocales.includes(value as Locale)
}

export function normalizeLocale(value: unknown): Locale {
  if (typeof value !== "string") return defaultLocale
  const language = value.trim().toLowerCase().split(/[-_]/, 1)[0]
  return isLocale(language) ? language : defaultLocale
}

export function preferredLocale(header: string | null | undefined): Locale {
  if (!header) return defaultLocale
  for (const entry of header.split(",")) {
    const value = entry.split(";", 1)[0]?.trim().toLowerCase()
    const language = value?.split(/[-_]/, 1)[0]
    if (isLocale(language)) return language
  }
  return defaultLocale
}
