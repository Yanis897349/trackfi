import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@trackfi/ui/components/field"
import { Textarea } from "@trackfi/ui/components/textarea"

import { useExpenseForm } from "../hooks/use-expense-form"
import type { Expense, ExpenseInput } from "../lib/expenses"
import { ExpenseFormBasics } from "./expense-form-basics"
import { ExpenseFormSchedule } from "./expense-form-schedule"
import { ExpenseTypeField } from "./expense-type-field"

export const expenseFormId = "expense-form"

export function ExpenseForm({
  currency,
  expense,
  error,
  onSubmit,
}: {
  currency: string
  expense: Expense | null
  error: string
  onSubmit(input: ExpenseInput): void
}) {
  const form = useExpenseForm({ currency, expense, onSubmit })
  return (
    <form id={expenseFormId} className="px-7 pb-6" onSubmit={form.submit}>
      <FieldGroup className="gap-5">
        <ExpenseTypeField form={form} />
        <ExpenseFormBasics form={form} />
        <ExpenseFormSchedule currency={currency} form={form} />
        <Field className="gap-2">
          <FieldLabel htmlFor="expense-notes">Note</FieldLabel>
          <Textarea
            id="expense-notes"
            className="h-[58px] min-h-[58px] resize-none px-3 py-2.5"
            placeholder="Optional context about this expense"
            value={form.values.notes}
            onChange={(event) => form.setValue("notes", event.target.value)}
            maxLength={2000}
          />
        </Field>
        {(form.validation || error) && (
          <FieldError>{form.validation || error}</FieldError>
        )}
      </FieldGroup>
    </form>
  )
}
