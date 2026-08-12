import { DateOnlyPicker } from "@trackfi/ui/components/date-only-picker"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@trackfi/ui/components/field"
import { Input } from "@trackfi/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@trackfi/ui/components/select"

import type { RevenueFormState } from "../hooks/use-revenue-form"
import { currencySymbol } from "../lib/currency"
import { revenueCadenceOptions, type RevenueCadence } from "../lib/revenue"
import { dateFnsLocale, m } from "../lib/i18n"

export function RevenueFormSchedule({
  currency,
  form,
}: {
  currency: string
  form: RevenueFormState
}) {
  const scheduled = form.values.scheduleType === "scheduled"
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_240px]">
        <Field className="gap-2">
          <FieldLabel htmlFor="revenue-amount">
            {scheduled
              ? m.revenue_take_home()
              : m.revenue_estimated_take_home()}
          </FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium">
              {currencySymbol(currency)}
            </span>
            <Input
              id="revenue-amount"
              className="h-[42px] pr-3 pl-8"
              type="number"
              placeholder="0.00"
              min={1 / form.divisor}
              step={1 / form.divisor}
              value={form.values.amount}
              onChange={(event) => form.setValue("amount", event.target.value)}
              required
            />
          </div>
        </Field>
        {scheduled && <CadenceField form={form} />}
      </div>
      {scheduled && (
        <Field className="gap-2">
          <FieldLabel htmlFor="revenue-payment-date">
            {m.revenue_next_expected_payment()}
          </FieldLabel>
          <DateOnlyPicker
            id="revenue-payment-date"
            className="h-[42px]"
            value={form.values.paymentAnchor}
            onChange={(value) => form.setValue("paymentAnchor", value)}
            locale={dateFnsLocale()}
            placeholder={m.calendar_pick_date()}
          />
          <FieldDescription className="text-xs">
            {m.revenue_schedule_description()}
          </FieldDescription>
        </Field>
      )}
    </>
  )
}

function CadenceField({ form }: { form: RevenueFormState }) {
  return (
    <Field className="gap-2">
      <FieldLabel>{m.revenue_repeats()}</FieldLabel>
      <Select
        items={revenueCadenceOptions}
        value={form.values.cadence}
        onValueChange={(value) =>
          form.setValue("cadence", value as RevenueCadence)
        }
      >
        <SelectTrigger
          className="h-[42px] w-full px-3 data-[size=default]:h-[42px]"
          aria-label={m.revenue_repeats()}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {revenueCadenceOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}
