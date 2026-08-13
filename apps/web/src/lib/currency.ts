import { intlLocale } from "./i18n"

export function currencySymbol(currency: string) {
  return (
    new Intl.NumberFormat(intlLocale(), {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency
  )
}

export function formatCompactMoney(amountMinor: number, currency: string) {
  const fractionDigits = currencyFractionDigits(currency)
  return new Intl.NumberFormat(intlLocale(), {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amountMinor / 10 ** fractionDigits)
}

export function formatMoney(amountMinor: number, currency: string) {
  const fractionDigits = currencyFractionDigits(currency)
  return new Intl.NumberFormat(intlLocale(), {
    style: "currency",
    currency,
  }).format(amountMinor / 10 ** fractionDigits)
}

export function formatSignedMoney(amountMinor: number, currency: string) {
  if (amountMinor === 0) return formatMoney(0, currency)
  return `${amountMinor > 0 ? "+" : "−"}${formatMoney(
    Math.abs(amountMinor),
    currency
  )}`
}

export function formatSignedPercent(value: number, fractionDigits = 1) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : ""
  return `${sign}${Math.abs(value).toFixed(fractionDigits)}%`
}

function currencyFractionDigits(currency: string) {
  return (
    new Intl.NumberFormat(intlLocale(), {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  )
}
