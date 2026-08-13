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
import { StableLoadingPlaceholder } from "@trackfi/ui/components/stable-loading-placeholder"
import { useStableLoadingState } from "@trackfi/ui/hooks/use-stable-loading-state"
import { cn } from "@trackfi/ui/lib/utils"

import { expenseSummaryQueryOptions } from "../lib/expenses"
import { formatMoney } from "../lib/subscriptions"
import { m } from "../lib/i18n"

export function ExpenseOverviewCard() {
  const query = useQuery(expenseSummaryQueryOptions())
  const loading = useStableLoadingState({
    isLoading: query.isLoading,
    isError: query.isError,
  })
  const summary = query.data?.summary
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptTextIcon className="size-4" /> {m.nav_expenses()}
        </CardTitle>
        <CardDescription>{m.expenses_overview_description()}</CardDescription>
        <CardAction>
          <Link
            to="/dashboard/expenses"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            {m.common_open()} <ArrowRightIcon />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {query.isError ? (
          <p className="text-sm text-muted-foreground">
            {m.expenses_unavailable()}
          </p>
        ) : loading.shouldRender ? (
          <StableLoadingPlaceholder isVisible={loading.isVisible}>
            <div
              className="grid grid-cols-2 gap-3"
              role="status"
              aria-label={m.expenses_loading()}
            >
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          </StableLoadingPlaceholder>
        ) : !summary?.currency ? (
          <p className="text-sm text-muted-foreground">
            {m.expenses_choose_currency_description()}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Metric
              label={m.expenses_spent_period()}
              value={formatMoney(summary.spentMinor, summary.currency)}
            />
            <Metric
              label={m.expenses_budget_remaining()}
              value={
                summary.remainingMinor === null
                  ? m.expenses_not_set()
                  : formatMoney(summary.remainingMinor, summary.currency)
              }
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
