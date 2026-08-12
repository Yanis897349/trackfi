import type { Subscription } from "./subscriptions"
import { m } from "./i18n"

export function subscriptionSecondaryLabel(subscription: Subscription) {
  return (
    subscription.notes?.split("\n")[0] ||
    websiteHostname(subscription.websiteUrl) ||
    m.subscriptions_no_details()
  )
}

function websiteHostname(websiteUrl: string | null) {
  if (!websiteUrl) return ""
  try {
    return new URL(websiteUrl).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

export function cadenceSuffix(cadence: Subscription["cadence"]) {
  return (
    {
      weekly: m.subscriptions_per_week(),
      monthly: m.subscriptions_per_month(),
      quarterly: m.subscriptions_per_quarter(),
      semiannual: m.subscriptions_per_six_months(),
      yearly: m.subscriptions_per_year(),
    } as const
  )[cadence]
}
