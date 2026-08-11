import { useState, type FormEvent } from "react"

import {
  Field,
  FieldDescription,
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
import { Textarea } from "@trackfi/ui/components/textarea"

import {
  displayLabel,
  subscriptionCadences,
  subscriptionCategories,
  type Subscription,
  type SubscriptionCadence,
  type SubscriptionCategory,
  type SubscriptionInput,
} from "../lib/subscriptions"

export const subscriptionFormId = "subscription-form"

export function SubscriptionForm({
  currency,
  subscription,
  error,
  onSubmit,
}: {
  currency: string
  subscription: Subscription | null
  error: string
  onSubmit(input: SubscriptionInput): void
}) {
  const fractionDigits =
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  const divisor = 10 ** fractionDigits
  const [name, setName] = useState(subscription?.name ?? "")
  const [amount, setAmount] = useState(
    subscription
      ? (subscription.amountMinor / divisor).toFixed(fractionDigits)
      : ""
  )
  const [cadence, setCadence] = useState<SubscriptionCadence>(
    subscription?.cadence ?? "monthly"
  )
  const [billingAnchor, setBillingAnchor] = useState(
    subscription?.nextRenewalDate ?? ""
  )
  const [category, setCategory] = useState<SubscriptionCategory>(
    subscription?.category ?? "software"
  )
  const [websiteUrl, setWebsiteUrl] = useState(subscription?.websiteUrl ?? "")
  const [notes, setNotes] = useState(subscription?.notes ?? "")
  const [validation, setValidation] = useState("")

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const numericAmount = Number(amount)
    if (
      !name.trim() ||
      !billingAnchor ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setValidation("Enter a name, positive amount, and billing date.")
      return
    }
    setValidation("")
    onSubmit({
      name: name.trim(),
      amountMinor: Math.round(numericAmount * divisor),
      cadence,
      billingAnchor,
      category,
      websiteUrl: websiteUrl.trim(),
      notes: notes.trim(),
    })
  }

  return (
    <form id={subscriptionFormId} className="px-4" onSubmit={submit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="subscription-name">Service name</FieldLabel>
          <Input
            id="subscription-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            autoFocus
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="subscription-amount">
              Amount ({currency})
            </FieldLabel>
            <Input
              id="subscription-amount"
              type="number"
              min={1 / divisor}
              step={1 / divisor}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel>Cadence</FieldLabel>
            <Select
              value={cadence}
              onValueChange={(value) =>
                setCadence(value as SubscriptionCadence)
              }
            >
              <SelectTrigger className="w-full" aria-label="Cadence">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subscriptionCadences.map((option) => (
                  <SelectItem key={option} value={option}>
                    {displayLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="subscription-date">Next billing date</FieldLabel>
          <Input
            id="subscription-date"
            type="date"
            value={billingAnchor}
            onChange={(event) => setBillingAnchor(event.target.value)}
            required
          />
          <FieldDescription>
            Future renewals are calculated from this date.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Category</FieldLabel>
          <Select
            value={category}
            onValueChange={(value) =>
              setCategory(value as SubscriptionCategory)
            }
          >
            <SelectTrigger className="w-full" aria-label="Category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subscriptionCategories.map((option) => (
                <SelectItem key={option} value={option}>
                  {displayLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="subscription-website">Website</FieldLabel>
          <Input
            id="subscription-website"
            type="url"
            placeholder="https://example.com"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="subscription-notes">Notes</FieldLabel>
          <Textarea
            id="subscription-notes"
            maxLength={2000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </Field>
        {(validation || error) && (
          <FieldError>{validation || error}</FieldError>
        )}
      </FieldGroup>
    </form>
  )
}
