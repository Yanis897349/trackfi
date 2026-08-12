import { Clock3Icon } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@trackfi/ui/components/table"
import { cn } from "@trackfi/ui/lib/utils"

import { formatDateOnly, formatShortDateOnly } from "../lib/date"
import type { RevenueSummary } from "../lib/revenue"
import { displayLabel, formatMoney } from "../lib/subscriptions"
import { m } from "../lib/i18n"

export function RevenueUpcomingIncomeCard({
  summary,
  currency,
}: {
  summary: RevenueSummary
  currency: string
}) {
  const upcoming = summary.upcomingIncome.slice(0, 3)

  return (
    <Card className="gap-0 py-0 shadow-xs">
      <CardHeader className="flex min-h-16 flex-col items-start justify-between gap-2 px-4 py-4 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="text-base font-semibold">
            {m.revenue_upcoming_income()}
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {m.revenue_upcoming_description()}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Clock3Icon className="size-4" />
          {m.revenue_due_amount_30_days({
            amount: formatMoney(summary.upcomingTotalMinor, currency),
          })}
        </div>
      </CardHeader>
      {upcoming.length ? (
        <>
          <div className="hidden lg:block">
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow className="hover:bg-muted">
                  <TableHead className="pl-4">{m.revenue_source()}</TableHead>
                  <TableHead className="w-[170px]">
                    {m.revenue_expected()}
                  </TableHead>
                  <TableHead className="w-[210px]">
                    {m.revenue_take_home()}
                  </TableHead>
                  <TableHead className="w-[190px] pr-4">
                    {m.common_status()}
                  </TableHead>
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
                        : m.revenue_this_month()}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatMoney(item.amountMinor, currency)}
                    </TableCell>
                    <TableCell className="pr-4">
                      <IncomeTypeBadge
                        scheduleType={item.scheduleType}
                        cadence={item.cadence}
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
                      : m.revenue_this_month()}{" "}
                    · {displayLabel(item.category)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <IncomeTypeBadge
                      scheduleType={item.scheduleType}
                      cadence={item.cadence}
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
          {m.revenue_no_upcoming_income()}
        </CardContent>
      )}
    </Card>
  )
}

function IncomeTypeBadge({
  scheduleType,
  cadence,
}: {
  scheduleType: RevenueSummary["upcomingIncome"][number]["scheduleType"]
  cadence: RevenueSummary["upcomingIncome"][number]["cadence"]
}) {
  const scheduled = scheduleType === "scheduled"
  const oneTime = cadence === "once"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
        scheduled
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          scheduled ? "bg-emerald-500" : "bg-orange-500"
        )}
        aria-hidden="true"
      />
      {oneTime
        ? m.revenue_one_time()
        : scheduled
          ? m.revenue_scheduled()
          : m.revenue_estimated()}
    </span>
  )
}
