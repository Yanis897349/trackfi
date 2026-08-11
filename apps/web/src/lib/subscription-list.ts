import type { Subscription } from "./subscriptions"

export function subscriptionSecondaryLabel(subscription: Subscription) {
  return (
    subscription.notes?.split("\n")[0] ||
    websiteHostname(subscription.websiteUrl) ||
    "No additional details"
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
      weekly: "week",
      monthly: "month",
      quarterly: "quarter",
      semiannual: "6 months",
      yearly: "year",
    } as const
  )[cadence]
}
