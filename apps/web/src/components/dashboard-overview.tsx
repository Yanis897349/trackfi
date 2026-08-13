import { Link } from "@tanstack/react-router"

import { buttonVariants } from "@trackfi/ui/components/button"
import { Card, CardTitle } from "@trackfi/ui/components/card"
import { Skeleton } from "@trackfi/ui/components/skeleton"
import { cn } from "@trackfi/ui/lib/utils"

import type { DashboardOverview as DashboardOverviewData } from "../lib/dashboard"
import { m } from "../lib/i18n"
import { DashboardActivitySection } from "./dashboard-activity-section"
import { DashboardDateRangePicker } from "./dashboard-date-range-picker"
import { DashboardFinancialPulse } from "./dashboard-financial-pulse"
import { DashboardMoneyModules } from "./dashboard-money-modules"
import { DashboardQuickAdd } from "./dashboard-quick-add"

export function DashboardOverview({
  overview,
  isFetching,
  onRangeChange,
  onPageChange,
}: {
  overview: DashboardOverviewData
  isFetching: boolean
  onRangeChange(range: { from: string; to: string }): void
  onPageChange(page: number): void
}) {
  const { currency } = overview

  return (
    <section
      className="mx-auto w-full max-w-[1120px] space-y-[18px] transition-opacity data-[updating=true]:opacity-70 motion-reduce:transition-none"
      data-updating={isFetching}
      aria-busy={isFetching}
    >
      <DashboardHeader
        currency={currency}
        from={overview.range.from}
        to={overview.range.to}
        onRangeChange={onRangeChange}
      />
      {!currency ? (
        <CurrencyRequired />
      ) : (
        <>
          <DashboardFinancialPulse overview={overview} currency={currency} />
          <DashboardMoneyModules overview={overview} currency={currency} />
          <DashboardActivitySection
            overview={overview}
            currency={currency}
            onPageChange={onPageChange}
          />
        </>
      )}
    </section>
  )
}

function DashboardHeader({
  currency,
  from,
  to,
  onRangeChange,
}: {
  currency: string | null
  from: string
  to: string
  onRangeChange(range: { from: string; to: string }): void
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-[-0.035em] sm:text-[28px]">
          {m.dashboard_money_title()}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {m.dashboard_money_description()}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <DashboardDateRangePicker
          from={from}
          to={to}
          onChange={onRangeChange}
        />
        <DashboardQuickAdd currency={currency} />
      </div>
    </header>
  )
}

function CurrencyRequired() {
  return (
    <Card className="items-start gap-3 p-6">
      <CardTitle>{m.subscriptions_choose_currency_title()}</CardTitle>
      <p className="max-w-xl text-sm text-muted-foreground">
        {m.error_currency_required()}
      </p>
      <Link
        to="/dashboard/settings"
        className={cn(buttonVariants({ variant: "default" }), "mt-1")}
      >
        {m.subscriptions_open_settings()}
      </Link>
    </Card>
  )
}

export function DashboardOverviewLoading() {
  return (
    <div
      className="mx-auto w-full max-w-[1120px] space-y-[18px]"
      role="status"
      aria-label={m.dashboard_loading()}
    >
      <div className="flex justify-between gap-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-64" />
      </div>
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <Skeleton className="h-[260px] rounded-xl" />
        <Skeleton className="h-[260px] rounded-xl" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-[180px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[390px] rounded-xl" />
    </div>
  )
}
