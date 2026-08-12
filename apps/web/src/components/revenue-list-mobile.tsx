import { Card, CardContent } from "@trackfi/ui/components/card"

import { formatDateOnly } from "../lib/date"
import { revenueAmountSuffix, type RevenueSource } from "../lib/revenue"
import { displayLabel, formatMoney } from "../lib/subscriptions"
import { RevenueActions, type RevenueListActions } from "./revenue-actions"
import {
  type RevenueListPagination,
  RevenueSourceIcon,
  RevenueStatusBadge,
} from "./revenue-list-parts"
import { SubscriptionPagination } from "./subscription-list-parts"
import { m } from "../lib/i18n"

export function RevenueListMobile({
  sources,
  currency,
  shown,
  total,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  ...actions
}: {
  sources: RevenueSource[]
  currency: string
} & RevenueListPagination &
  RevenueListActions) {
  return (
    <div className="grid gap-3 md:hidden">
      {sources.map((source) => (
        <Card key={source.id} size="sm">
          <CardContent className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <RevenueSourceIcon category={source.category} />
              <div className="min-w-0">
                <p className="truncate font-medium">{source.name}</p>
                <p className="mt-1 text-sm">
                  {formatMoney(source.amountMinor, currency)}{" "}
                  {revenueAmountSuffix(source)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {source.nextPaymentDate
                    ? m.revenue_next_expected_payment() +
                      ` ${formatDateOnly(source.nextPaymentDate)}`
                    : source.scheduleType === "variable"
                      ? m.revenue_variable_estimate()
                      : m.revenue_no_upcoming()}{" "}
                  · {displayLabel(source.category)}
                </p>
                <div className="mt-3">
                  <RevenueStatusBadge source={source} />
                </div>
              </div>
            </div>
            <RevenueActions source={source} {...actions} />
          </CardContent>
        </Card>
      ))}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-muted-foreground">
          {m.revenue_count({ shown, total })}
        </p>
        <SubscriptionPagination
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={onPrevious}
          onNext={onNext}
        />
      </div>
    </div>
  )
}
