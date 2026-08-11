import { useMemo } from "react"

import { Calendar } from "@trackfi/ui/components/calendar"
import { cn } from "@trackfi/ui/lib/utils"

import {
  calendarDateOnly,
  subscriptionCategoryStyle,
} from "../lib/subscription-calendar"
import type { RenewalOccurrence } from "../lib/subscriptions"
import { BrandLogo, SubscriptionPreview } from "./subscription-brand"

export function SubscriptionRenewalMonth({
  month,
  renewals,
  currency,
}: {
  month: Date
  renewals: RenewalOccurrence[]
  currency: string
}) {
  const renewalsByDate = useMemo(() => {
    const grouped = new Map<string, RenewalOccurrence[]>()
    for (const renewal of renewals) {
      const dateRenewals = grouped.get(renewal.renewalDate) ?? []
      dateRenewals.push(renewal)
      grouped.set(renewal.renewalDate, dateRenewals)
    }
    return grouped
  }, [renewals])

  return (
    <div className="min-w-[43rem]">
      <Calendar
        month={month}
        weekStartsOn={1}
        hideNavigation
        showOutsideDays
        className="w-full p-0"
        classNames={{
          root: "w-full",
          months: "w-full",
          month: "w-full gap-0",
          month_caption: "hidden",
          month_grid: "w-full border-collapse",
          weekdays: "flex w-full border-b bg-muted/50",
          weekday:
            "flex-1 py-2.5 text-center text-[11px] font-semibold text-muted-foreground",
          week: "m-0 flex w-full",
          day: "relative min-h-24 flex-1 border-r border-b p-0 text-left last:border-r-0",
          outside: "bg-muted/20 text-muted-foreground",
          today: "bg-accent/40",
        }}
        components={{
          Day: ({ day, modifiers, ...cellProps }) => {
            const date = calendarDateOnly(day.date)
            const dateRenewals = renewalsByDate.get(date) ?? []
            return (
              <td {...cellProps}>
                <div className="flex min-h-24 flex-col gap-1 p-1.5">
                  <span
                    className={cn(
                      "ml-1 text-xs",
                      modifiers.outside && "text-muted-foreground"
                    )}
                  >
                    {day.date.getDate()}
                  </span>
                  {dateRenewals.slice(0, 2).map((renewal) => (
                    <SubscriptionPreview
                      key={renewal.id}
                      details={renewal}
                      currency={currency}
                      align="start"
                      triggerClassName="block w-full"
                    >
                      <span
                        className={cn(
                          "flex w-full items-center gap-1 rounded px-1.5 py-1 text-[10px] font-medium",
                          subscriptionCategoryStyle(renewal.category)
                        )}
                      >
                        <BrandLogo
                          name={renewal.name}
                          websiteUrl={renewal.websiteUrl}
                          className="size-4 rounded-sm bg-transparent text-[9px]"
                        />
                        <span className="truncate">{renewal.name}</span>
                      </span>
                    </SubscriptionPreview>
                  ))}
                  {dateRenewals.length > 2 && (
                    <span className="px-1 text-[10px] text-muted-foreground">
                      +{dateRenewals.length - 2} more
                    </span>
                  )}
                </div>
              </td>
            )
          },
        }}
      />
    </div>
  )
}
