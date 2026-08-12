import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ArrowRightIcon, CalendarClockIcon } from "lucide-react"

import { buttonVariants } from "@trackfi/ui/components/button"
import { cn } from "@trackfi/ui/lib/utils"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"
import { Skeleton } from "@trackfi/ui/components/skeleton"

import {
  formatMoney,
  subscriptionSummaryQueryOptions,
} from "../lib/subscriptions"
import { m } from "../lib/i18n"

export function SubscriptionOverviewCard() {
  const query = useQuery(subscriptionSummaryQueryOptions())
  const summary = query.data?.summary

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClockIcon className="size-4" />
          {m.nav_subscriptions()}
        </CardTitle>
        <CardDescription>
          {m.subscriptions_overview_description()}
        </CardDescription>
        <CardAction>
          <Link
            to="/dashboard/subscriptions"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            {m.common_open()} <ArrowRightIcon />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <div
            className="grid grid-cols-2 gap-3"
            role="status"
            aria-label={m.subscriptions_loading()}
            aria-busy="true"
          >
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : query.isError ? (
          <p className="text-sm text-muted-foreground">
            {m.subscriptions_unavailable()}
          </p>
        ) : !summary?.currency ? (
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-sm font-medium">
              {m.subscriptions_choose_currency_title()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {m.subscriptions_choose_currency_description()}
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
              label={m.subscriptions_monthly_equivalent()}
              value={formatMoney(
                summary.monthlyEquivalentMinor,
                summary.currency
              )}
            />
            <Metric
              label={m.subscriptions_due_30_days()}
              value={String(summary.upcomingCount)}
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
