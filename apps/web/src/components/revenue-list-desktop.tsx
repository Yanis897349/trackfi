import { Card, CardFooter } from "@trackfi/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@trackfi/ui/components/table"

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

export function RevenueListDesktop({
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
    <Card className="hidden gap-0 py-0 md:flex">
      <Table className="text-[13px]">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">{m.revenue_source()}</TableHead>
            <TableHead className="w-[140px]">
              {m.subscriptions_category()}
            </TableHead>
            <TableHead className="w-[210px]">{m.revenue_take_home()}</TableHead>
            <TableHead className="w-[155px]">
              {m.revenue_next_payment()}
            </TableHead>
            <TableHead className="w-[110px]">{m.common_status()}</TableHead>
            <TableHead className="w-16">
              <span className="sr-only">{m.common_actions()}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.map((source) => (
            <TableRow key={source.id} className="h-[72px]">
              <TableCell className="pl-4">
                <div className="flex items-center gap-3">
                  <RevenueSourceIcon category={source.category} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {source.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {source.cadence === "once" ? (
                        m.revenue_one_time_income()
                      ) : (
                        <>
                          {formatMoney(source.monthlyEquivalentMinor, currency)}{" "}
                          {source.scheduleType === "variable"
                            ? m.revenue_estimated_monthly_label()
                            : m.revenue_projected_monthly_label()}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{displayLabel(source.category)}</TableCell>
              <TableCell className="font-medium">
                {formatMoney(source.amountMinor, currency)}{" "}
                {revenueAmountSuffix(source)}
              </TableCell>
              <TableCell>
                {source.nextPaymentDate
                  ? formatDateOnly(source.nextPaymentDate)
                  : source.scheduleType === "variable"
                    ? m.revenue_variable()
                    : m.revenue_no_upcoming()}
              </TableCell>
              <TableCell>
                <RevenueStatusBadge source={source} />
              </TableCell>
              <TableCell className="text-right">
                <RevenueActions source={source} {...actions} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <CardFooter className="h-14 justify-between bg-card px-4 py-0">
        <p className="text-xs text-muted-foreground">
          {m.revenue_count({ shown, total })}
        </p>
        <SubscriptionPagination
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={onPrevious}
          onNext={onNext}
        />
      </CardFooter>
    </Card>
  )
}
