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
          <FieldLabel>Category</FieldLabel>
          <Select
            items={subscriptionCategoryOptions}
            value={category}
            onValueChange={(value) =>
              onCategoryChange(value as SubscriptionCategory)
            }
          >
            <SelectTrigger
              className="h-10 w-full px-3 data-[size=default]:h-10"
              aria-label="Category"
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
          <FieldLabel htmlFor="subscription-website">Website</FieldLabel>
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
        <FieldLabel htmlFor="subscription-notes">Notes</FieldLabel>
        <Textarea
          id="subscription-notes"
          className="min-h-[88px] px-3 py-2"
          maxLength={2000}
          placeholder="Optional details, owner, or cancellation terms…"
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
        />
      </Field>
    </>
  )
}
