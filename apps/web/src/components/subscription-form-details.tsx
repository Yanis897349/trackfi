import { Field, FieldLabel } from "@trackfi/ui/components/field"
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
  subscriptionCategoryOptions,
  type SubscriptionCategory,
} from "../lib/subscriptions"
import { m } from "../lib/i18n"

export function SubscriptionFormDetails({
  category,
  notes,
  websiteUrl,
  onCategoryChange,
  onNotesChange,
  onWebsiteUrlChange,
}: {
  category: SubscriptionCategory
  notes: string
  websiteUrl: string
  onCategoryChange(value: SubscriptionCategory): void
  onNotesChange(value: string): void
  onWebsiteUrlChange(value: string): void
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>{m.subscriptions_category()}</FieldLabel>
          <Select
            items={subscriptionCategoryOptions}
            value={category}
            onValueChange={(value) =>
              onCategoryChange(value as SubscriptionCategory)
            }
          >
            <SelectTrigger
              className="h-10 w-full px-3 data-[size=default]:h-10"
              aria-label={m.subscriptions_category()}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subscriptionCategoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="subscription-website">
            {m.subscriptions_website()}
          </FieldLabel>
          <Input
            id="subscription-website"
            className="h-10 px-3"
            type="url"
            placeholder="https://example.com"
            value={websiteUrl}
            onChange={(event) => onWebsiteUrlChange(event.target.value)}
          />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="subscription-notes">
          {m.subscriptions_notes()}
        </FieldLabel>
        <Textarea
          id="subscription-notes"
          className="min-h-[88px] px-3 py-2"
          maxLength={2000}
          placeholder={m.subscriptions_notes_placeholder()}
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
        />
      </Field>
    </>
  )
}
