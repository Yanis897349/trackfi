import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { Skeleton } from "@trackfi/ui/components/skeleton"
import { StableLoadingPlaceholder } from "@trackfi/ui/components/stable-loading-placeholder"
import { useStableLoadingState } from "@trackfi/ui/hooks/use-stable-loading-state"

import { DashboardCalendarView } from "../components/dashboard-calendar-view"
import { DashboardQuickAdd } from "../components/dashboard-quick-add"
import { ModuleError, ModuleHeader } from "../components/module-layout"
import { CurrencyRequiredState } from "../components/subscription-states"
import { dashboardCalendarQueryOptions } from "../lib/dashboard"
import { localDate } from "../lib/date"
import { m } from "../lib/i18n"
import { formatMonthKey, monthKeyDate } from "../lib/subscription-calendar"

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/

export const Route = createFileRoute("/dashboard/calendar")({
  validateSearch: z.object({
    month: z.string().regex(monthPattern).optional().catch(undefined),
  }),
  component: DashboardCalendarRoute,
})

function DashboardCalendarRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const monthKey = search.month ?? localDate().slice(0, 7)
  const calendar = useQuery(dashboardCalendarQueryOptions(monthKey))
  const loading = useStableLoadingState({
    isLoading: calendar.isLoading,
    isError: calendar.isError,
  })

  if (calendar.isError) {
    return <ModuleError retry={() => void calendar.refetch()} />
  }
  if (loading.shouldRender || !calendar.data) {
    return (
      <StableLoadingPlaceholder isVisible={loading.isVisible}>
        <DashboardCalendarLoading />
      </StableLoadingPlaceholder>
    )
  }
  if (!calendar.data.calendar.currency) {
    return (
      <CurrencyRequiredState
        title={m.dashboard_calendar_title()}
        description={m.dashboard_calendar_currency_description()}
      />
    )
  }

  const displayedMonth = monthKeyDate(calendar.data.calendar.month)
  return (
    <section
      className="mx-auto w-full max-w-[1120px] space-y-5 transition-opacity data-[updating=true]:opacity-70 motion-reduce:transition-none"
      data-updating={calendar.isPlaceholderData}
      aria-busy={calendar.isPlaceholderData || undefined}
    >
      <ModuleHeader
        title={m.dashboard_calendar_title()}
        description={m.dashboard_calendar_description()}
        action={
          <DashboardQuickAdd currency={calendar.data.calendar.currency} />
        }
      />
      <DashboardCalendarView
        calendar={calendar.data.calendar}
        currency={calendar.data.calendar.currency}
        isUpdating={calendar.isPlaceholderData}
        month={displayedMonth}
        onMonthChange={(month) =>
          void navigate({ search: { month: formatMonthKey(month) } })
        }
      />
    </section>
  )
}

function DashboardCalendarLoading() {
  return (
    <section
      className="mx-auto w-full max-w-[1120px] space-y-5"
      role="status"
      aria-label={m.dashboard_calendar_loading()}
    >
      <div className="flex justify-between gap-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-9 w-full" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2.05fr)_minmax(18rem,1fr)]">
        <Skeleton className="h-[46rem]" />
        <Skeleton className="h-[46rem]" />
      </div>
    </section>
  )
}
