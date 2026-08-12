import { Field, FieldLabel } from "@trackfi/ui/components/field"
import { Input } from "@trackfi/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@trackfi/ui/components/select"

import type { ExpenseFormState } from "../hooks/use-expense-form"
import { expenseCategoryOptions, type ExpenseCategory } from "../lib/expenses"

export function ExpenseFormBasics({ form }: { form: ExpenseFormState }) {
  return (
    <>
      <Field className="gap-2">
        <FieldLabel htmlFor="expense-name">Expense name</FieldLabel>
        <Input
          id="expense-name"
          className="h-[42px] px-3"
          placeholder="e.g. Rent, groceries, or cinema"
          value={form.values.name}
          onChange={(event) => form.setValue("name", event.target.value)}
          maxLength={100}
          autoFocus
          required
        />
      </Field>
      <Field className="gap-2">
        <FieldLabel>Category</FieldLabel>
        <Select
          items={expenseCategoryOptions}
          value={form.values.category}
          onValueChange={(value) =>
            form.setValue("category", value as ExpenseCategory)
          }
        >
          <SelectTrigger
            className="h-[42px] w-full px-3 data-[size=default]:h-[42px]"
            aria-label="Category"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {expenseCategoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </>
  )
}
