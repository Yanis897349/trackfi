import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ArrowRightIcon, BanknoteIcon } from "lucide-react"

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

import { revenueSummaryQueryOptions } from "../lib/revenue"
import { formatMoney } from "../lib/subscriptions"
import { m } from "../lib/i18n"

export function RevenueOverviewCard() {
  const query = useQuery(revenueSummaryQueryOptions())
  const loading = useStableLoadingState({
    isLoading: query.isLoading,
    isError: query.isError,
  })
  const summary = query.data?.summary
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BanknoteIcon className="size-4" /> {m.nav_revenue()}
        </CardTitle>
        <CardDescription>{m.revenue_expected_by_source()}</CardDescription>
        <CardAction>
          <Link
            to="/dashboard/revenue"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            {m.common_open()} <ArrowRightIcon />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {query.isError ? (
          <p className="text-sm text-muted-foreground">
            {m.revenue_unavailable()}
          </p>
        ) : loading.shouldRender ? (
          <StableLoadingPlaceholder isVisible={loading.isVisible}>
            <div
              className="grid grid-cols-2 gap-3"
              role="status"
              aria-label={m.revenue_loading()}
            >
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          </StableLoadingPlaceholder>
        ) : !summary?.currency ? (
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-sm font-medium">
              {m.subscriptions_choose_currency_title()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {m.revenue_choose_currency_description()}
            </p>
            <Link
              to="/dashboard/settings"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-3"
              )}
            >
              {m.subscriptions_open_settings()}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Metric
              label={m.revenue_expected_monthly()}
              value={formatMoney(
                summary.monthlyEquivalentMinor,
                summary.currency
              )}
            />
            <Metric
              label={m.revenue_due_30_days()}
              value={formatMoney(summary.upcomingTotalMinor, summary.currency)}
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
