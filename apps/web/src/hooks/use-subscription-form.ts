import { useState, type FormEvent } from "react"

import { intlLocale } from "../lib/i18n"
import { m } from "../lib/i18n"

import type {
  Subscription,
  SubscriptionCadence,
  SubscriptionCategory,
  SubscriptionInput,
} from "../lib/subscriptions"

interface SubscriptionFormValues {
  amount: string
  billingAnchor: string
  cadence: SubscriptionCadence
  category: SubscriptionCategory
  name: string
  notes: string
  websiteUrl: string
}

export function useSubscriptionForm({
  currency,
  subscription,
  onSubmit,
}: {
  currency: string
  subscription: Subscription | null
  onSubmit(input: SubscriptionInput): void
}) {
  const fractionDigits =
    new Intl.NumberFormat(intlLocale(), {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  const divisor = 10 ** fractionDigits
  const [values, setValues] = useState<SubscriptionFormValues>(() => ({
    amount: subscription
      ? (subscription.amountMinor / divisor).toFixed(fractionDigits)
      : "",
    billingAnchor: subscription?.nextRenewalDate ?? "",
    cadence: subscription?.cadence ?? "monthly",
    category: subscription?.category ?? "software",
    name: subscription?.name ?? "",
    notes: subscription?.notes ?? "",
    websiteUrl: subscription?.websiteUrl ?? "",
  }))
  const [billingAnchorChanged, setBillingAnchorChanged] = useState(false)
  const [validation, setValidation] = useState("")

  function setValue<Key extends keyof SubscriptionFormValues>(
    key: Key,
    value: SubscriptionFormValues[Key]
  ) {
    setValues((current) => ({ ...current, [key]: value }))
    if (key === "billingAnchor") setBillingAnchorChanged(true)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const numericAmount = Number(values.amount)
    if (
      !values.name.trim() ||
      !values.billingAnchor ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setValidation(m.subscriptions_validation())
      return
    }
    setValidation("")
    onSubmit({
      name: values.name.trim(),
      amountMinor: Math.round(numericAmount * divisor),
      cadence: values.cadence,
      billingAnchor:
        subscription && !billingAnchorChanged
          ? subscription.billingAnchor
          : values.billingAnchor,
      category: values.category,
      websiteUrl: values.websiteUrl.trim(),
      notes: values.notes.trim(),
    })
  }

  return { divisor, setValue, submit, validation, values }
}
