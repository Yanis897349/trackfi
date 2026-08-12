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
import { cn } from "@trackfi/ui/lib/utils"

import { revenueSummaryQueryOptions } from "../lib/revenue"
import { formatMoney } from "../lib/subscriptions"

export function RevenueOverviewCard() {
  const query = useQuery(revenueSummaryQueryOptions())
  const summary = query.data?.summary
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BanknoteIcon className="size-4" /> Revenue
        </CardTitle>
        <CardDescription>Expected take-home income by source.</CardDescription>
        <CardAction>
          <Link
            to="/dashboard/revenue"
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
            aria-label="Loading revenue overview"
          >
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : query.isError ? (
          <p className="text-sm text-muted-foreground">
            Revenue insights are temporarily unavailable.
          </p>
        ) : !summary?.currency ? (
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-sm font-medium">Choose your currency</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Set an account currency before adding revenue sources.
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
              label="Expected monthly"
              value={formatMoney(
                summary.monthlyEquivalentMinor,
                summary.currency
              )}
            />
            <Metric
              label="Due in 30 days"
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
