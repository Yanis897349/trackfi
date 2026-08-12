import { Field, FieldLabel } from "@trackfi/ui/components/field"
import { Input } from "@trackfi/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@trackfi/ui/components/select"

import type { RevenueFormState } from "../hooks/use-revenue-form"
import { revenueCategoryOptions, type RevenueCategory } from "../lib/revenue"
import { RevenueConfidenceField } from "./revenue-confidence-field"
import { m } from "../lib/i18n"

export function RevenueFormBasics({ form }: { form: RevenueFormState }) {
  return (
    <>
      <RevenueConfidenceField form={form} />
      <Field className="gap-2">
        <FieldLabel htmlFor="revenue-name">
          {m.revenue_source_name()}
        </FieldLabel>
        <Input
          id="revenue-name"
          className="h-[42px] px-3"
          placeholder={m.revenue_source_placeholder()}
          value={form.values.name}
          onChange={(event) => form.setValue("name", event.target.value)}
          maxLength={100}
          autoFocus
          required
        />
      </Field>
      <Field className="gap-2">
        <FieldLabel>{m.subscriptions_category()}</FieldLabel>
        <Select
          items={revenueCategoryOptions}
          value={form.values.category}
          onValueChange={(value) =>
            form.setValue("category", value as RevenueCategory)
          }
        >
          <SelectTrigger
            className="h-[42px] w-full px-3 data-[size=default]:h-[42px]"
            aria-label={m.subscriptions_category()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {revenueCategoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </>
  )
}
