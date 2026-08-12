import { Field, FieldLabel } from "@trackfi/ui/components/field"
import { cn } from "@trackfi/ui/lib/utils"

import { expenseStatusOptions, type ExpenseStatus } from "../lib/expenses"

export function ExpenseStatusField({
  value,
  onChange,
}: {
  value: ExpenseStatus
  onChange(value: ExpenseStatus): void
}) {
  return (
    <Field className="gap-1.5">
      <FieldLabel id="expense-status-label">Status</FieldLabel>
      <div
        className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1"
        role="radiogroup"
        aria-labelledby="expense-status-label"
      >
        {expenseStatusOptions.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex h-8 cursor-pointer items-center justify-center gap-2 rounded-md text-xs font-medium transition-colors",
              value === option.value
                ? "bg-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <input
              className="sr-only"
              type="radio"
              name="expense-status"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span
              className={cn("size-1.5 rounded-full", statusDot(option.value))}
            />
            {option.label}
          </label>
        ))}
      </div>
    </Field>
  )
}

function statusDot(status: ExpenseStatus) {
  if (status === "approved") return "bg-emerald-500"
  if (status === "declined") return "bg-red-500"
  return "bg-amber-500"
}
