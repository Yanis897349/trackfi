import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { PlusIcon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import { Skeleton } from "@trackfi/ui/components/skeleton"
import { StableLoadingPlaceholder } from "@trackfi/ui/components/stable-loading-placeholder"
import { useStableLoadingState } from "@trackfi/ui/hooks/use-stable-loading-state"

import { SubscriptionCalendarView } from "../components/subscription-calendar-view"
import { ModuleError, ModuleHeader } from "../components/module-layout"
import { SubscriptionFormDialog } from "../components/subscription-form-dialog"
import { CurrencyRequiredState } from "../components/subscription-states"
import { useSubscriptionManager } from "../hooks/use-subscriptions"
import { formatMonthKey, monthDate } from "../lib/subscription-calendar"
import { settingsQueryOptions } from "../lib/settings"
import { renewalCalendarQueryOptions } from "../lib/subscriptions"
import { m } from "../lib/i18n"

export const Route = createFileRoute("/dashboard/subscriptions_/calendar")({
  component: SubscriptionCalendarRoute,
})

function SubscriptionCalendarRoute() {
  const [month, setMonth] = useState(() => monthDate(new Date()))
  const settings = useQuery(settingsQueryOptions())
  const calendar = useQuery(renewalCalendarQueryOptions(formatMonthKey(month)))
  const manager = useSubscriptionManager()
  const currency =
    settings.data?.settings.currency ?? calendar.data?.calendar.currency
  const hasError = settings.isError || calendar.isError
  const loading = useStableLoadingState({
    isLoading: settings.isLoading || calendar.isLoading,
    isError: hasError,
  })

  if (hasError) {
    return (
      <ModuleError
        retry={() => {
          void settings.refetch()
          void calendar.refetch()
        }}
      />
    )
  }
  if (loading.shouldRender) {
    return (
      <StableLoadingPlaceholder isVisible={loading.isVisible}>
        <CalendarLoadingState />
      </StableLoadingPlaceholder>
    )
  }
  if (!currency) {
    return (
      <CurrencyRequiredState
        title={m.calendar_title()}
        description={m.calendar_currency_description()}
      />
    )
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5">
      <ModuleHeader
        title={m.calendar_title()}
        description={m.calendar_description()}
        action={
          <Button size="lg" className="px-4" onClick={manager.openCreate}>
            <PlusIcon /> {m.subscriptions_add()}
          </Button>
        }
      />
      <SubscriptionCalendarView
        calendar={calendar.data!.calendar}
        currency={currency}
        month={month}
        message={manager.message}
        onMonthChange={setMonth}
      />
      <SubscriptionFormDialog
        currency={currency}
        subscription={manager.editing}
        open={manager.dialogOpen}
        pending={manager.savePending}
        error={manager.message}
        onOpenChange={manager.closeDialog}
        onOpenChangeComplete={manager.finishDialogChange}
        onSubmit={manager.save}
      />
    </section>
  )
}

function CalendarLoadingState() {
  return (
    <section
      className="mx-auto w-full max-w-6xl space-y-5"
      role="status"
      aria-label={m.calendar_loading()}
    >
      <ModuleHeader
        title={m.calendar_title()}
        description={m.calendar_description()}
        action={<Skeleton className="h-9 w-40" />}
      />
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <Skeleton className="h-[34rem]" />
        <Skeleton className="h-[34rem]" />
      </div>
    </section>
  )
}
