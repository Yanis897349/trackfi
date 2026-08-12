import type { MockApiHandler } from "./mock-api-types"

export function createSubscriptionMock(
  subscriptions: Array<Record<string, unknown>>,
  currency: string | null
): MockApiHandler {
  return ({ url }) => {
    if (url.includes("/api/subscriptions/calendar")) {
      return {
        body: {
          calendar: {
            month: "2026-08",
            rangeStart: "2026-07-27",
            rangeEnd: "2026-09-06",
            currency,
            renewalCount: subscriptions.length,
            totalMinor: subscriptions.length ? 1000 : 0,
            categoryCount: subscriptions.length ? 1 : 0,
            monthTotalMinor: subscriptions.length ? 1000 : 0,
            renewals: subscriptions.map((subscription) => ({
              id: `${subscription.id}:${subscription.nextRenewalDate}`,
              subscriptionId: subscription.id,
              name: subscription.name,
              amountMinor: subscription.amountMinor,
              cadence: subscription.cadence,
              category: subscription.category,
              websiteUrl: subscription.websiteUrl,
              renewalDate: subscription.nextRenewalDate,
            })),
          },
        },
      }
    }

    if (url.includes("/api/subscriptions/summary")) {
      return {
        body: {
          summary: {
            currency,
            activeCount: subscriptions.length,
            pausedCount: 0,
            activeCategoryCount: subscriptions.length ? 1 : 0,
            monthlyEquivalentMinor: subscriptions.length ? 1000 : 0,
            annualEquivalentMinor: subscriptions.length ? 12000 : 0,
            upcomingCount: subscriptions.length,
            upcomingTotalMinor: subscriptions.length ? 1000 : 0,
            upcoming: subscriptions,
            monthlyComparison: null,
          },
        },
      }
    }

    if (!url.includes("/api/subscriptions")) return undefined
    return {
      body: {
        subscriptions,
        page: 1,
        pageSize: 3,
        total: subscriptions.length,
      },
    }
  }
}
