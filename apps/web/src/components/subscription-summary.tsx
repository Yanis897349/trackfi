import { CalendarClockIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"

import { formatDateOnly } from "../lib/date"
import {
  formatMoney,
  type SubscriptionSummary as Summary,
} from "../lib/subscriptions"

export function SubscriptionSummary({
  summary,
  currency,
}: {
  summary: Summary
  currency: string
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active services"
          value={String(summary.activeCount)}
        />
        <MetricCard
          label="Monthly equivalent"
          value={formatMoney(summary.monthlyEquivalentMinor, currency)}
        />
        <MetricCard
          label="Annual equivalent"
          value={formatMoney(summary.annualEquivalentMinor, currency)}
        />
        <MetricCard
          label="Due in 30 days"
          value={String(summary.upcomingCount)}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClockIcon className="size-4" /> Upcoming renewals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.upcoming.length ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {summary.upcoming.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-muted/60 p-3"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateOnly(item.nextRenewalDate)}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatMoney(item.amountMinor, currency)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active renewals are due in the next 30 days.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  )
}
