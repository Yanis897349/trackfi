import type { MockApiHandler } from "./mock-api-types"

export function createRevenueMock(
  revenueSources: Array<Record<string, unknown>>,
  currency: string | null
): MockApiHandler {
  return ({ url }) => {
    if (url.includes("/api/revenue-sources/summary")) {
      const active = revenueSources.filter(
        (source) => source.status === "active"
      )
      const requestUrl = new URL(url, "https://trackfi.test")
      const months = Number(requestUrl.searchParams.get("months") ?? "6")
      const asOf = requestUrl.searchParams.get("asOf") ?? "2026-08-12"
      const monthlyEquivalentMinor = active.reduce(
        (total, source) => total + Number(source.monthlyEquivalentMinor ?? 0),
        0
      )
      return {
        body: {
          summary: {
            currency,
            activeCount: active.length,
            pausedCount: revenueSources.filter(
              (source) => source.status === "paused"
            ).length,
            variableCount: active.filter(
              (source) => source.scheduleType === "variable"
            ).length,
            activeCategoryCount: active.length ? 1 : 0,
            monthlyEquivalentMinor,
            annualEquivalentMinor: active.reduce(
              (total, source) =>
                total + Number(source.annualEquivalentMinor ?? 0),
              0
            ),
            upcomingCount: active.filter((source) => source.nextPaymentDate)
              .length,
            upcomingTotalMinor: active.reduce(
              (total, source) =>
                total +
                (source.nextPaymentDate ? Number(source.amountMinor) : 0),
              0
            ),
            sourceBreakdown: active.map((source) => ({
              sourceId: source.id,
              name: source.name,
              category: source.category,
              monthlyEquivalentMinor: source.monthlyEquivalentMinor,
            })),
            upcoming: [],
            forecast: {
              months,
              totalMinor: monthlyEquivalentMinor * months,
              previousMonthMinor: monthlyEquivalentMinor,
              series: Array.from({ length: months }, (_, index) => ({
                month: addMockMonths(asOf.slice(0, 7), index),
                amountMinor: monthlyEquivalentMinor,
              })),
            },
            upcomingIncome: active.map((source) => ({
              id: `${source.id}:upcoming`,
              sourceId: source.id,
              name: source.name,
              category: source.category,
              amountMinor: source.amountMinor,
              scheduleType: source.scheduleType,
              cadence: source.cadence,
              expectedDate: source.nextPaymentDate ?? null,
            })),
          },
        },
      }
    }

    if (!url.includes("/api/revenue-sources")) return undefined
    return {
      body: {
        revenueSources,
        page: 1,
        pageSize: 3,
        total: revenueSources.length,
      },
    }
  }
}

function addMockMonths(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number)
  return new Date(Date.UTC(year!, monthNumber! - 1 + offset, 1))
    .toISOString()
    .slice(0, 7)
}
