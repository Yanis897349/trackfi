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

import type { ExpenseFormState } from "../hooks/use-expense-form"
import { currencySymbol } from "../lib/currency"
import { expenseCadenceOptions, type ExpenseCadence } from "../lib/expenses"

export function ExpenseFormSchedule({
  currency,
  form,
}: {
  currency: string
  form: ExpenseFormState
}) {
  const scheduled = form.values.scheduleType === "scheduled"
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_240px]">
        <Field className="gap-2">
          <FieldLabel htmlFor="expense-amount">
            {scheduled ? "Expected amount" : "Estimated monthly spend"}
          </FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium">
              {currencySymbol(currency)}
            </span>
            <Input
              id="expense-amount"
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
          <FieldLabel htmlFor="expense-date">Next expected date</FieldLabel>
          <DateOnlyPicker
            id="expense-date"
            className="h-[42px]"
            value={form.values.expenseAnchor}
            onChange={(value) => form.setValue("expenseAnchor", value)}
          />
          <FieldDescription className="text-xs">
            We’ll use this date to build your spending forecast.
          </FieldDescription>
        </Field>
      )}
    </>
  )
}

function CadenceField({ form }: { form: ExpenseFormState }) {
  return (
    <Field className="gap-2">
      <FieldLabel>Repeats</FieldLabel>
      <Select
        items={expenseCadenceOptions}
        value={form.values.cadence}
        onValueChange={(value) =>
          form.setValue("cadence", value as ExpenseCadence)
        }
      >
        <SelectTrigger
          className="h-[42px] w-full px-3 data-[size=default]:h-[42px]"
          aria-label="Repeats"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {expenseCadenceOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}
