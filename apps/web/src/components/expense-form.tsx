import { ReceiptTextIcon } from "lucide-react"

import { DateOnlyPicker } from "@trackfi/ui/components/date-only-picker"
import {
  Field,
  FieldError,
  FieldGroup,
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
import { Switch } from "@trackfi/ui/components/switch"
import { Textarea } from "@trackfi/ui/components/textarea"

import { useExpenseForm } from "../hooks/use-expense-form"
import { currencySymbol } from "../lib/currency"
import {
  expenseCategoryOptions,
  type Expense,
  type ExpenseCategory,
  type ExpenseInput,
} from "../lib/expenses"
import { ExpenseReceiptField } from "./expense-receipt-field"
import { ExpenseStatusField } from "./expense-status-field"

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
  onSubmit(input: ExpenseInput, receipt: File | null): void
}) {
  const form = useExpenseForm({ currency, expense, onSubmit })
  const receiptName =
    form.receipt?.name ?? (!form.removeReceipt ? expense?.receipt?.name : null)
  return (
    <form id={expenseFormId} className="px-7 py-5" onSubmit={form.submit}>
      <FieldGroup className="gap-[15px]">
        <Field className="gap-1.5">
          <FieldLabel htmlFor="expense-merchant">
            Merchant or expense name
          </FieldLabel>
          <div className="relative">
            <ReceiptTextIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="expense-merchant"
              autoFocus
              required
              maxLength={100}
              className="h-10 pl-9"
              placeholder="e.g. Acme Coffee Roasters"
              value={form.values.merchant}
              onChange={(event) =>
                form.setValue("merchant", event.target.value)
              }
            />
          </div>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="expense-amount">Amount</FieldLabel>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                {currencySymbol(currency)}
              </span>
              <Input
                id="expense-amount"
                required
                type="number"
                min={1 / form.divisor}
                step={1 / form.divisor}
                className="h-10 pl-8"
                placeholder="0.00"
                value={form.values.amount}
                onChange={(event) =>
                  form.setValue("amount", event.target.value)
                }
              />
            </div>
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="expense-date">Date</FieldLabel>
            <DateOnlyPicker
              id="expense-date"
              value={form.values.transactionDate}
              onChange={(value) => form.setValue("transactionDate", value)}
            />
          </Field>
        </div>
        <Field className="gap-1.5">
          <FieldLabel>Category</FieldLabel>
          <Select
            items={expenseCategoryOptions}
            value={form.values.category}
            onValueChange={(value) =>
              form.setValue("category", value as ExpenseCategory)
            }
          >
            <SelectTrigger
              className="h-10 w-full data-[size=default]:h-10"
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
        <ExpenseStatusField
          value={form.values.status}
          onChange={(value) => form.setValue("status", value)}
        />
        <ExpenseReceiptField
          receiptName={receiptName}
          onSelect={form.selectReceipt}
          onRemove={() => {
            form.selectReceipt(null)
            form.setRemoveReceipt(true)
          }}
        />
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium">Reimbursable expense</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Mark this purchase for repayment
            </p>
          </div>
          <Switch
            aria-label="Reimbursable expense"
            checked={form.values.reimbursable}
            onCheckedChange={(checked) =>
              form.setValue("reimbursable", checked)
            }
          />
        </div>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="expense-notes">Note</FieldLabel>
          <Textarea
            id="expense-notes"
            className="h-[62px] min-h-[62px] resize-none"
            placeholder="Add context for approvers (optional)"
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
