import { useState, type FormEvent } from "react"

import { Button } from "@trackfi/ui/components/button"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@trackfi/ui/components/sheet"
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

export function SubscriptionFormSheet({
  currency,
  subscription,
  open,
  pending,
  error,
  onOpenChange,
  onSubmit,
}: {
  currency: string
  subscription: Subscription | null
  open: boolean
  pending: boolean
  error: string
  onOpenChange(open: boolean): void
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>
            {subscription ? "Edit subscription" : "Add subscription"}
          </SheetTitle>
          <SheetDescription>
            Track the recurring amount and the next expected billing date.
          </SheetDescription>
        </SheetHeader>
        <form id="subscription-form" className="px-4" onSubmit={submit}>
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
              <FieldLabel htmlFor="subscription-date">
                Next billing date
              </FieldLabel>
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
        <SheetFooter className="border-t sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="subscription-form" disabled={pending}>
            {pending
              ? "Saving…"
              : subscription
                ? "Save changes"
                : "Add subscription"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
