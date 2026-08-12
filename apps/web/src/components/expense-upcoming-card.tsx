import { Clock3Icon } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"
import { Badge } from "@trackfi/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@trackfi/ui/components/table"

import { formatDateOnly, formatShortDateOnly } from "../lib/date"
import type { ExpenseSummary } from "../lib/expenses"
import { displayLabel, formatMoney } from "../lib/subscriptions"

export function ExpenseUpcomingCard({
  summary,
  currency,
}: {
  summary: ExpenseSummary
  currency: string
}) {
  const upcoming = summary.upcomingSpending.slice(0, 3)
  return (
    <Card className="gap-0 py-0 shadow-xs">
      <CardHeader className="flex min-h-16 flex-col items-start justify-between gap-2 px-4 py-4 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="text-base font-semibold">
            Upcoming spending
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Scheduled costs, estimates, and subscription renewals
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Clock3Icon className="size-4" />
          {formatMoney(summary.upcomingScheduledTotalMinor, currency)} scheduled
          in 30 days
        </div>
      </CardHeader>
      {upcoming.length ? (
        <>
          <div className="hidden lg:block">
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow className="hover:bg-muted">
                  <TableHead className="pl-4">Expense</TableHead>
                  <TableHead className="w-[170px]">Expected</TableHead>
                  <TableHead className="w-[210px]">Amount</TableHead>
                  <TableHead className="w-[190px] pr-4">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map((item) => (
                  <TableRow
                    key={item.id}
                    className="h-[72px] hover:bg-muted/30"
                  >
                    <TableCell className="pl-4">
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {displayLabel(item.category)}
                      </p>
                    </TableCell>
                    <TableCell>
                      {item.expectedDate
                        ? formatShortDateOnly(item.expectedDate)
                        : "This month"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatMoney(item.amountMinor, currency)}
                    </TableCell>
                    <TableCell className="pr-4">
                      <OriginBadge
                        origin={item.origin}
                        variable={!item.expectedDate}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-3 border-t p-4 lg:hidden">
            {upcoming.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-lg bg-muted/60 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">
                    {item.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.expectedDate
                      ? formatDateOnly(item.expectedDate)
                      : "This month"}{" "}
                    · {displayLabel(item.category)}
                  </p>
                  <div className="mt-2">
                    <OriginBadge
                      origin={item.origin}
                      variable={!item.expectedDate}
                    />
                  </div>
                </div>
                <p className="shrink-0 text-base font-semibold">
                  {formatMoney(item.amountMinor, currency)}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <CardContent className="border-t py-6 text-sm text-muted-foreground">
          Add an expense or subscription to see upcoming spending.
        </CardContent>
      )}
    </Card>
  )
}

function OriginBadge({
  origin,
  variable,
}: {
  origin: "expense" | "subscription"
  variable: boolean
}) {
  return (
    <Badge
      variant="outline"
      className="border-transparent bg-muted text-muted-foreground"
    >
      {origin === "subscription"
        ? "Subscription"
        : variable
          ? "Estimate"
          : "Expense"}
    </Badge>
  )
}
