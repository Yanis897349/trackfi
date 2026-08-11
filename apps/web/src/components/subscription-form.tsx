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
  subscriptionCadenceOptions,
  type Subscription,
  type SubscriptionCadence,
  type SubscriptionInput,
} from "../lib/subscriptions"
import { useSubscriptionForm } from "../hooks/use-subscription-form"
import { SubscriptionDatePicker } from "./subscription-date-picker"
import { SubscriptionFormDetails } from "./subscription-form-details"

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
  const form = useSubscriptionForm({ currency, subscription, onSubmit })

  return (
    <form id={subscriptionFormId} className="px-6 pb-6" onSubmit={form.submit}>
      <FieldGroup className="gap-[18px]">
        <Field>
          <FieldLabel htmlFor="subscription-name">Service name</FieldLabel>
          <Input
            id="subscription-name"
            className="h-10 px-3"
            placeholder="e.g. Notion, Spotify, Figma"
            value={form.values.name}
            onChange={(event) => form.setValue("name", event.target.value)}
            maxLength={100}
            autoFocus
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="subscription-amount">
              Amount ({currency})
            </FieldLabel>
            <Input
              id="subscription-amount"
              className="h-10 px-3"
              type="number"
              placeholder="0.00"
              min={1 / form.divisor}
              step={1 / form.divisor}
              value={form.values.amount}
              onChange={(event) => form.setValue("amount", event.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel>Cadence</FieldLabel>
            <Select
              items={subscriptionCadenceOptions}
              value={form.values.cadence}
              onValueChange={(value) =>
                form.setValue("cadence", value as SubscriptionCadence)
              }
            >
              <SelectTrigger
                className="h-10 w-full px-3 data-[size=default]:h-10"
                aria-label="Cadence"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subscriptionCadenceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="subscription-date">Next billing date</FieldLabel>
          <SubscriptionDatePicker
            id="subscription-date"
            value={form.values.billingAnchor}
            onChange={(value) => form.setValue("billingAnchor", value)}
          />
          <FieldDescription className="text-xs">
            Future renewals are calculated from this date.
          </FieldDescription>
        </Field>
        <SubscriptionFormDetails
          category={form.values.category}
          notes={form.values.notes}
          websiteUrl={form.values.websiteUrl}
          onCategoryChange={(value) => form.setValue("category", value)}
          onNotesChange={(value) => form.setValue("notes", value)}
          onWebsiteUrlChange={(value) => form.setValue("websiteUrl", value)}
        />
        {(form.validation || error) && (
          <FieldError>{form.validation || error}</FieldError>
        )}
      </FieldGroup>
    </form>
  )
}
