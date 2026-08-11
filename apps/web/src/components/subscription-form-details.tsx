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
  displayLabel,
  subscriptionCategories,
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
      <Field>
        <FieldLabel>Category</FieldLabel>
        <Select
          value={category}
          onValueChange={(value) =>
            onCategoryChange(value as SubscriptionCategory)
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
          onChange={(event) => onWebsiteUrlChange(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="subscription-notes">Notes</FieldLabel>
        <Textarea
          id="subscription-notes"
          maxLength={2000}
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
        />
      </Field>
    </>
  )
}
