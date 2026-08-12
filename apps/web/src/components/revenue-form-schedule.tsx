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
import { revenueCadenceOptions, type RevenueCadence } from "../lib/revenue"

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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="revenue-amount">
            {scheduled
              ? `Take-home per payment (${currency})`
              : `Estimated monthly take-home (${currency})`}
          </FieldLabel>
          <Input
            id="revenue-amount"
            className="h-10 px-3"
            type="number"
            placeholder="0.00"
            min={1 / form.divisor}
            step={1 / form.divisor}
            value={form.values.amount}
            onChange={(event) => form.setValue("amount", event.target.value)}
            required
          />
        </Field>
        {scheduled && <CadenceField form={form} />}
      </div>
      {scheduled && (
        <Field>
          <FieldLabel htmlFor="revenue-payment-date">
            Next payment date
          </FieldLabel>
          <DateOnlyPicker
            id="revenue-payment-date"
            value={form.values.paymentAnchor}
            onChange={(value) => form.setValue("paymentAnchor", value)}
          />
          <FieldDescription className="text-xs">
            Future payments are forecast from this date.
          </FieldDescription>
        </Field>
      )}
    </>
  )
}

function CadenceField({ form }: { form: RevenueFormState }) {
  return (
    <Field>
      <FieldLabel>Cadence</FieldLabel>
      <Select
        items={revenueCadenceOptions}
        value={form.values.cadence}
        onValueChange={(value) =>
          form.setValue("cadence", value as RevenueCadence)
        }
      >
        <SelectTrigger
          className="h-10 w-full px-3 data-[size=default]:h-10"
          aria-label="Cadence"
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
