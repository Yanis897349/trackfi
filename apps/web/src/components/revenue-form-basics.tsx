import { ChevronDownIcon } from "lucide-react"

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

export function RevenueFormBasics({
  currency,
  form,
}: {
  currency: string
  form: RevenueFormState
}) {
  return (
    <>
      <RevenueConfidenceField form={form} />
      <Field className="gap-2">
        <FieldLabel htmlFor="revenue-name">Source name</FieldLabel>
        <Input
          id="revenue-name"
          className="h-[42px] px-3"
          placeholder="e.g. Acme salary or Design clients"
          value={form.values.name}
          onChange={(event) => form.setValue("name", event.target.value)}
          maxLength={100}
          autoFocus
          required
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
        <Field className="gap-2">
          <FieldLabel>Category</FieldLabel>
          <Select
            items={revenueCategoryOptions}
            value={form.values.category}
            onValueChange={(value) =>
              form.setValue("category", value as RevenueCategory)
            }
          >
            <SelectTrigger
              className="h-[42px] w-full px-3 data-[size=default]:h-[42px]"
              aria-label="Category"
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
        <Field className="gap-2">
          <FieldLabel>Currency</FieldLabel>
          <div
            className="flex h-[42px] items-center justify-between rounded-md border border-input bg-transparent px-3 text-sm dark:bg-input/30"
            role="textbox"
            aria-label="Currency"
            aria-readonly="true"
          >
            <span>{currency}</span>
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          </div>
        </Field>
      </div>
    </>
  )
}
