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
    <form id={subscriptionFormId} className="px-4" onSubmit={form.submit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="subscription-name">Service name</FieldLabel>
          <Input
            id="subscription-name"
            value={form.values.name}
            onChange={(event) => form.setValue("name", event.target.value)}
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
              <SelectTrigger className="w-full" aria-label="Cadence">
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
          <Input
            id="subscription-date"
            type="date"
            value={form.values.billingAnchor}
            onChange={(event) =>
              form.setValue("billingAnchor", event.target.value)
            }
            required
          />
          <FieldDescription>
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
