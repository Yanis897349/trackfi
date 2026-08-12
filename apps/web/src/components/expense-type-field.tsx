import { Field, FieldLabel } from "@trackfi/ui/components/field"
import { cn } from "@trackfi/ui/lib/utils"

import type { ExpenseFormState } from "../hooks/use-expense-form"
import type { ExpenseScheduleType } from "../lib/expenses"

const expenseTypeOptions: Array<{
  value: ExpenseScheduleType
  label: string
  description: string
}> = [
  {
    value: "scheduled",
    label: "Scheduled",
    description: "A dated recurring or one-time expense",
  },
  {
    value: "variable",
    label: "Monthly estimate",
    description: "Flexible spending based on your best estimate",
  },
]

export function ExpenseTypeField({ form }: { form: ExpenseFormState }) {
  return (
    <Field className="gap-2">
      <FieldLabel id="expense-type-label">Expense type</FieldLabel>
      <div
        className="grid gap-2.5 sm:grid-cols-2"
        role="radiogroup"
        aria-labelledby="expense-type-label"
      >
        {expenseTypeOptions.map((option) => {
          const selected = form.values.scheduleType === option.value
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-[72px] cursor-pointer items-center gap-2.5 rounded-lg border-[1.5px] p-3 transition-colors",
                !selected && "border-border bg-background hover:bg-muted/50",
                selected &&
                  "border-orange-500 bg-orange-50 dark:bg-orange-950/50"
              )}
            >
              <input
                type="radio"
                name="expense-type"
                value={option.value}
                checked={selected}
                onChange={() => form.setValue("scheduleType", option.value)}
                className="size-4 shrink-0 appearance-none rounded-full border-[1.5px] border-muted-foreground/60 bg-background outline-none checked:border-orange-600 checked:bg-orange-600 focus-visible:ring-3 focus-visible:ring-orange-500/30"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </Field>
  )
}
