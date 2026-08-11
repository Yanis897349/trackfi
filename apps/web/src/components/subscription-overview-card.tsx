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

export function SubscriptionOverviewCard() {
  const query = useQuery(subscriptionSummaryQueryOptions())
  const summary = query.data?.summary

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClockIcon className="size-4" />
          Subscriptions
        </CardTitle>
        <CardDescription>Recurring costs and the next 30 days.</CardDescription>
        <CardAction>
          <Link
            to="/dashboard/subscriptions"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Open <ArrowRightIcon />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : query.isError ? (
          <p className="text-sm text-muted-foreground">
            Subscription insights are temporarily unavailable.
          </p>
        ) : !summary?.currency ? (
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-sm font-medium">Choose your currency</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Set an account currency before adding recurring services.
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
              label="Monthly equivalent"
              value={formatMoney(
                summary.monthlyEquivalentMinor,
                summary.currency
              )}
            />
            <Metric
              label="Due in 30 days"
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
