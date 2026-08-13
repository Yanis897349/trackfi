import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"

import { formatMonthTitle } from "../lib/subscription-calendar"
import {
  displayLabel,
  formatMoney,
  type RenewalCalendar,
  type RenewalOccurrence,
} from "../lib/subscriptions"
import { BrandLogo, SubscriptionPreview } from "./subscription-brand"
import { intlLocale, m } from "../lib/i18n"

export function SubscriptionRenewalAgenda({
  calendar,
  currency,
  month,
}: {
  calendar: RenewalCalendar
  currency: string
  month: Date
}) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle>{m.calendar_upcoming()}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {m.calendar_renewal_count({ count: calendar.renewalCount })} ·{" "}
          {m.calendar_due({
            amount: formatMoney(calendar.totalMinor, currency),
          })}
        </p>
      </CardHeader>
      <CardContent className="max-h-[34rem] overflow-y-auto px-0 py-1">
        {calendar.renewals.length ? (
          calendar.renewals.map((renewal) => (
            <RenewalAgendaItem
              key={renewal.id}
              renewal={renewal}
              currency={currency}
            />
          ))
        ) : (
          <p className="p-4 text-sm text-muted-foreground">
            {m.calendar_no_renewals()}
          </p>
        )}
      </CardContent>
      <CardFooter className="justify-between bg-card px-4 py-4">
        <span className="text-xs text-muted-foreground">
          {m.calendar_month_total({ month: formatMonthTitle(month) })}
        </span>
        <span className="font-semibold">
          {formatMoney(calendar.monthTotalMinor, currency)}
        </span>
      </CardFooter>
    </Card>
  )
}

function RenewalAgendaItem({
  renewal,
  currency,
}: {
  renewal: RenewalOccurrence
  currency: string
}) {
  const date = new Date(`${renewal.renewalDate}T00:00:00Z`)
  return (
    <SubscriptionPreview
      details={renewal}
      currency={currency}
      triggerClassName="block w-full"
    >
      <span className="flex w-full items-center gap-3 px-4 py-3 hover:bg-muted/50">
        <span className="w-9 shrink-0 text-center">
          <span className="block text-[10px] font-semibold text-muted-foreground uppercase">
            {new Intl.DateTimeFormat(intlLocale(), {
              month: "short",
              timeZone: "UTC",
            }).format(date)}
          </span>
          <span className="block text-sm font-semibold">
            {date.getUTCDate().toString().padStart(2, "0")}
          </span>
        </span>
        <BrandLogo
          name={renewal.name}
          websiteUrl={renewal.websiteUrl}
          className="size-7 bg-transparent [&>span]:p-0.5"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {renewal.name}
          </span>
          <span className="block text-xs text-muted-foreground">
            {displayLabel(renewal.category)}
          </span>
        </span>
        <span className="shrink-0 text-xs font-medium">
          {formatMoney(renewal.amountMinor, currency)}
        </span>
      </span>
    </SubscriptionPreview>
  )
}
