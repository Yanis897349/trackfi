import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { PlusIcon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import { Skeleton } from "@trackfi/ui/components/skeleton"

import { SubscriptionCalendarView } from "../components/subscription-calendar-view"
import { ModuleError, ModuleHeader } from "../components/module-layout"
import { SubscriptionFormDialog } from "../components/subscription-form-dialog"
import { CurrencyRequiredState } from "../components/subscription-states"
import { useSubscriptionManager } from "../hooks/use-subscriptions"
import { formatMonthKey, monthDate } from "../lib/subscription-calendar"
import { settingsQueryOptions } from "../lib/settings"
import { renewalCalendarQueryOptions } from "../lib/subscriptions"

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

  if (settings.isLoading || calendar.isLoading) {
    return <CalendarLoadingState />
  }
  if (settings.isError || calendar.isError) {
    return (
      <ModuleError
        retry={() => {
          void settings.refetch()
          void calendar.refetch()
        }}
      />
    )
  }
  if (!currency) {
    return (
      <CurrencyRequiredState
        title="Renewal calendar"
        description="Choose an account currency before planning subscription renewals."
      />
    )
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5">
      <ModuleHeader
        title="Renewal calendar"
        description="Plan ahead with a monthly view of every subscription renewal."
        action={
          <Button size="lg" className="px-4" onClick={manager.openCreate}>
            <PlusIcon /> Add subscription
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
      aria-label="Loading renewal calendar"
    >
      <ModuleHeader
        title="Renewal calendar"
        description="Plan ahead with a monthly view of every subscription renewal."
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
