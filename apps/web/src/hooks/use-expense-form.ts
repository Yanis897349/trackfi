import { useState, type FormEvent } from "react"

import { localDate } from "../lib/date"
import type {
  Expense,
  ExpenseCategory,
  ExpenseInput,
  ExpenseStatus,
} from "../lib/expenses"

export interface ExpenseFormValues {
  merchant: string
  amount: string
  transactionDate: string
  category: ExpenseCategory
  status: ExpenseStatus
  reimbursable: boolean
  notes: string
}

export function useExpenseForm({
  currency,
  expense,
  onSubmit,
}: {
  currency: string
  expense: Expense | null
  onSubmit(input: ExpenseInput, receipt: File | null): void
}) {
  const fractionDigits =
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  const divisor = 10 ** fractionDigits
  const [values, setValues] = useState<ExpenseFormValues>(() => ({
    merchant: expense?.merchant ?? "",
    amount: expense
      ? (expense.amountMinor / divisor).toFixed(fractionDigits)
      : "",
    transactionDate: expense?.transactionDate ?? localDate(),
    category: expense?.category ?? "entertainment",
    status: expense?.status ?? "pending",
    reimbursable: expense?.reimbursable ?? false,
    notes: expense?.notes ?? "",
  }))
  const [receipt, setReceipt] = useState<File | null>(null)
  const [removeReceipt, setRemoveReceipt] = useState(false)
  const [validation, setValidation] = useState("")

  function setValue<Key extends keyof ExpenseFormValues>(
    key: Key,
    value: ExpenseFormValues[Key]
  ) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function selectReceipt(file: File | null) {
    setReceipt(file)
    if (file) setRemoveReceipt(false)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = Number(values.amount)
    if (!values.merchant.trim() || !Number.isFinite(amount) || amount <= 0) {
      setValidation("Enter a merchant and a positive amount.")
      return
    }
    if (receipt && receipt.size > 10 * 1024 * 1024) {
      setValidation("Receipt files must be 10 MB or smaller.")
      return
    }
    setValidation("")
    onSubmit(
      {
        merchant: values.merchant.trim(),
        amountMinor: Math.round(amount * divisor),
        transactionDate: values.transactionDate,
        category: values.category,
        status: values.status,
        reimbursable: values.reimbursable,
        notes: values.notes.trim(),
        ...(removeReceipt ? { removeReceipt: true } : {}),
      },
      receipt
    )
  }

  return {
    divisor,
    receipt,
    removeReceipt,
    selectReceipt,
    setRemoveReceipt,
    setValue,
    submit,
    validation,
    values,
  }
}

export type ExpenseFormState = ReturnType<typeof useExpenseForm>
