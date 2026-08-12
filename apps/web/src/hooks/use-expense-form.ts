import { useState, type FormEvent } from "react"

import type {
  Expense,
  ExpenseCadence,
  ExpenseCategory,
  ExpenseInput,
  ExpenseScheduleType,
} from "../lib/expenses"

export interface ExpenseFormValues {
  amount: string
  cadence: ExpenseCadence
  category: ExpenseCategory
  expenseAnchor: string
  name: string
  notes: string
  scheduleType: ExpenseScheduleType
}

export function useExpenseForm({
  currency,
  expense,
  onSubmit,
}: {
  currency: string
  expense: Expense | null
  onSubmit(input: ExpenseInput): void
}) {
  const fractionDigits =
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  const divisor = 10 ** fractionDigits
  const [values, setValues] = useState<ExpenseFormValues>(() => ({
    amount: expense
      ? (expense.amountMinor / divisor).toFixed(fractionDigits)
      : "",
    cadence: expense?.cadence ?? "monthly",
    category: expense?.category ?? "housing",
    expenseAnchor: expense?.nextExpenseDate ?? expense?.expenseAnchor ?? "",
    name: expense?.name ?? "",
    notes: expense?.notes ?? "",
    scheduleType: expense?.scheduleType ?? "scheduled",
  }))
  const [expenseAnchorChanged, setExpenseAnchorChanged] = useState(false)
  const [validation, setValidation] = useState("")

  function setValue<Key extends keyof ExpenseFormValues>(
    key: Key,
    value: ExpenseFormValues[Key]
  ) {
    setValues((current) => ({ ...current, [key]: value }))
    if (key === "expenseAnchor") setExpenseAnchorChanged(true)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const numericAmount = Number(values.amount)
    if (
      !values.name.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      (values.scheduleType === "scheduled" && !values.expenseAnchor)
    ) {
      setValidation(
        values.scheduleType === "scheduled"
          ? "Enter a name, positive amount, and next expected date."
          : "Enter a name and positive monthly estimate."
      )
      return
    }
    setValidation("")
    onSubmit({
      name: values.name.trim(),
      amountMinor: Math.round(numericAmount * divisor),
      scheduleType: values.scheduleType,
      cadence: values.scheduleType === "scheduled" ? values.cadence : null,
      expenseAnchor:
        values.scheduleType === "scheduled"
          ? expense &&
            !expenseAnchorChanged &&
            values.cadence === expense.cadence
            ? expense.expenseAnchor
            : values.expenseAnchor
          : null,
      category: values.category,
      notes: values.notes.trim(),
    })
  }

  return { divisor, setValue, submit, validation, values }
}

export type ExpenseFormState = ReturnType<typeof useExpenseForm>
