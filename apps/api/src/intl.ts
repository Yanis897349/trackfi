import type { Locale } from "@trackfi/localization"

export function intlLocale(locale: Locale) {
  return locale === "fr" ? "fr-FR" : "en-US"
}

export function formatCurrencyMinor(
  amountMinor: number,
  currency: string,
  locale: Locale
) {
  const formatter = new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
  })
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2
  return formatter.format(amountMinor / 10 ** digits)
}

export function formatDateOnlyRange(
  start: string,
  end: string,
  locale: Locale
) {
  const formatter = new Intl.DateTimeFormat(intlLocale(locale), {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
  return `${formatter.format(dateOnly(start))}–${formatter.format(dateOnly(end))}`
}

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00Z`)
}
