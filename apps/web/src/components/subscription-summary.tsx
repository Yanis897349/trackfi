import { Link } from "@tanstack/react-router"
import {
  CalendarDaysIcon,
  CalendarClockIcon,
  ChartNoAxesColumnIncreasingIcon,
  CheckCircle2Icon,
  WalletIcon,
} from "lucide-react"

import { buttonVariants } from "@trackfi/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"
import { cn } from "@trackfi/ui/lib/utils"

import {
  displayLabel,
  formatMoney,
  monthlyComparisonLabel,
  type SubscriptionSummary as Summary,
} from "../lib/subscriptions"
import { BrandLogo, SubscriptionPreview } from "./subscription-brand"

export function SubscriptionSummary({
  summary,
  currency,
}: {
  summary: Summary
  currency: string
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active subscriptions"
          value={String(summary.activeCount)}
          context={
            summary.activeCount === 0
              ? "No active services"
              : summary.pausedCount
                ? `${summary.pausedCount} paused`
                : "All services running"
          }
          icon={CheckCircle2Icon}
        />
        <MetricCard
          label="Monthly spend"
          value={formatMoney(summary.monthlyEquivalentMinor, currency)}
          context={monthlyComparisonLabel(summary)}
          icon={WalletIcon}
        />
        <MetricCard
          label="Annual commitment"
          value={formatMoney(summary.annualEquivalentMinor, currency)}
          context={`Across ${summary.activeCategoryCount} ${summary.activeCategoryCount === 1 ? "category" : "categories"}`}
          icon={ChartNoAxesColumnIncreasingIcon}
        />
        <MetricCard
          label="Renewing soon"
          value={String(summary.upcomingCount)}
          context="Within the next 30 days"
          icon={CalendarClockIcon}
        />
      </div>
      <Card className="gap-0 rounded-lg py-0 shadow-xs sm:h-[190px]">
        <CardHeader className="h-[68px] items-center px-5 py-4">
          <div>
            <CardTitle className="font-semibold">Upcoming renewals</CardTitle>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Next 30 days · {formatMoney(summary.upcomingTotalMinor, currency)}{" "}
              committed
            </p>
          </div>
          <CardAction className="self-center">
            <Link
              to="/dashboard/subscriptions/calendar"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <CalendarDaysIcon /> View calendar
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent className="px-5 pt-2 pb-5">
          {summary.upcoming.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {summary.upcoming.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="flex min-h-[94px] items-center justify-between gap-3 rounded-lg bg-muted p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <SubscriptionPreview
                      currency={currency}
                      details={{ ...item, renewalDate: item.nextRenewalDate }}
                    >
                      <SubscriptionLogo item={item} />
                    </SubscriptionPreview>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {item.name}
                      </p>
                      <p className="mt-[3px] truncate text-xs text-muted-foreground">
                        {displayLabel(item.category)} · renews{" "}
                        {formatRenewalDate(item.nextRenewalDate)}
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 text-[15px] font-semibold">
                    {formatMoney(item.amountMinor, currency)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active renewals are due in the next 30 days.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function SubscriptionLogo({ item }: { item: Summary["upcoming"][number] }) {
  return (
    <BrandLogo
      name={item.name}
      websiteUrl={item.websiteUrl}
      className="size-10 rounded-lg bg-card ring-1 ring-foreground/10 [&>span]:p-3"
    />
  )
}

function formatRenewalDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`))
}

function MetricCard({
  label,
  value,
  context,
  icon: Icon,
}: {
  label: string
  value: string
  context: string
  icon: typeof CalendarClockIcon
}) {
  return (
    <Card className="h-[126px] shadow-xs">
      <CardContent className="flex h-full flex-col justify-center gap-2.5 px-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-medium text-muted-foreground">
            {label}
          </p>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <p className="text-[26px] leading-none font-normal tracking-[-0.6px]">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{context}</p>
      </CardContent>
    </Card>
  )
}
