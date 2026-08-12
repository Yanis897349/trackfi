import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ArrowRightIcon, ReceiptTextIcon } from "lucide-react"

import { buttonVariants } from "@trackfi/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"
import { Skeleton } from "@trackfi/ui/components/skeleton"
import { cn } from "@trackfi/ui/lib/utils"

import { expenseSummaryQueryOptions } from "../lib/expenses"
import { formatMoney } from "../lib/subscriptions"

export function ExpenseOverviewCard() {
  const query = useQuery(expenseSummaryQueryOptions())
  const summary = query.data?.summary
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptTextIcon className="size-4" /> Expenses
        </CardTitle>
        <CardDescription>
          Planned spending, including subscriptions.
        </CardDescription>
        <CardAction>
          <Link
            to="/dashboard/expenses"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Open <ArrowRightIcon />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <div
            className="grid grid-cols-2 gap-3"
            role="status"
            aria-label="Loading expense overview"
          >
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : query.isError ? (
          <p className="text-sm text-muted-foreground">
            Expense insights are temporarily unavailable.
          </p>
        ) : !summary?.currency ? (
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-sm font-medium">Choose your currency</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Set an account currency before adding planned expenses.
            </p>
            <Link
              to="/dashboard/settings"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-3"
              )}
            >
              Open settings
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Projected monthly"
              value={formatMoney(
                summary.forecast.averageMonthlyMinor,
                summary.currency
              )}
            />
            <Metric
              label="Scheduled in 30 days"
              value={formatMoney(
                summary.upcomingScheduledTotalMinor,
                summary.currency
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  )
}
