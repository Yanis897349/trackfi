import { useState, type FormEvent } from "react"

import type {
  RevenueCadence,
  RevenueCategory,
  RevenueScheduleType,
  RevenueSource,
  RevenueSourceInput,
} from "../lib/revenue"

export interface RevenueFormValues {
  amount: string
  cadence: RevenueCadence
  category: RevenueCategory
  name: string
  notes: string
  paymentAnchor: string
  scheduleType: RevenueScheduleType
}

export function useRevenueForm({
  currency,
  source,
  onSubmit,
}: {
  currency: string
  source: RevenueSource | null
  onSubmit(input: RevenueSourceInput): void
}) {
  const fractionDigits =
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  const divisor = 10 ** fractionDigits
  const [values, setValues] = useState<RevenueFormValues>(() => ({
    amount: source
      ? (source.amountMinor / divisor).toFixed(fractionDigits)
      : "",
    cadence: source?.cadence ?? "monthly",
    category: source?.category ?? "salary",
    name: source?.name ?? "",
    notes: source?.notes ?? "",
    paymentAnchor: source?.nextPaymentDate ?? "",
    scheduleType: source?.scheduleType ?? "scheduled",
  }))
  const [paymentAnchorChanged, setPaymentAnchorChanged] = useState(false)
  const [validation, setValidation] = useState("")

  function setValue<Key extends keyof RevenueFormValues>(
    key: Key,
    value: RevenueFormValues[Key]
  ) {
    setValues((current) => ({ ...current, [key]: value }))
    if (key === "paymentAnchor") setPaymentAnchorChanged(true)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const numericAmount = Number(values.amount)
    if (
      !values.name.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      (values.scheduleType === "scheduled" && !values.paymentAnchor)
    ) {
      setValidation(
        values.scheduleType === "scheduled"
          ? "Enter a source, positive amount, and next payment date."
          : "Enter a source and positive monthly estimate."
      )
      return
    }
    setValidation("")
    onSubmit({
      name: values.name.trim(),
      amountMinor: Math.round(numericAmount * divisor),
      scheduleType: values.scheduleType,
      cadence: values.scheduleType === "scheduled" ? values.cadence : null,
      paymentAnchor:
        values.scheduleType === "scheduled"
          ? source && !paymentAnchorChanged
            ? source.paymentAnchor
            : values.paymentAnchor
          : null,
      category: values.category,
      notes: values.notes.trim(),
    })
  }

  return { divisor, setValue, submit, validation, values }
}

export type RevenueFormState = ReturnType<typeof useRevenueForm>
