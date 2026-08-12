import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@trackfi/ui/components/field"
import { Textarea } from "@trackfi/ui/components/textarea"

import { useRevenueForm } from "../hooks/use-revenue-form"
import type { RevenueSource, RevenueSourceInput } from "../lib/revenue"
import { RevenueFormBasics } from "./revenue-form-basics"
import { RevenueFormSchedule } from "./revenue-form-schedule"

export const revenueFormId = "revenue-source-form"

export function RevenueForm({
  currency,
  source,
  error,
  onSubmit,
}: {
  currency: string
  source: RevenueSource | null
  error: string
  onSubmit(input: RevenueSourceInput): void
}) {
  const form = useRevenueForm({ currency, source, onSubmit })

  return (
    <form id={revenueFormId} className="px-6 pb-6" onSubmit={form.submit}>
      <FieldGroup className="gap-[18px]">
        <RevenueFormBasics form={form} />
        <RevenueFormSchedule currency={currency} form={form} />
        <Field>
          <FieldLabel htmlFor="revenue-notes">Notes</FieldLabel>
          <Textarea
            id="revenue-notes"
            placeholder="Optional details about this income source"
            value={form.values.notes}
            onChange={(event) => form.setValue("notes", event.target.value)}
            maxLength={2000}
          />
        </Field>
        {(form.validation || error) && (
          <FieldError>{form.validation || error}</FieldError>
        )}
      </FieldGroup>
    </form>
  )
}
