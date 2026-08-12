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
import {
  revenueCategoryOptions,
  type RevenueCategory,
  type RevenueScheduleType,
} from "../lib/revenue"

const scheduleOptions = [
  { value: "scheduled", label: "Scheduled income" },
  { value: "variable", label: "Variable monthly estimate" },
]

export function RevenueFormBasics({ form }: { form: RevenueFormState }) {
  return (
    <>
      <Field>
        <FieldLabel htmlFor="revenue-name">Source name</FieldLabel>
        <Input
          id="revenue-name"
          className="h-10 px-3"
          placeholder="e.g. Acme salary, Design clients"
          value={form.values.name}
          onChange={(event) => form.setValue("name", event.target.value)}
          maxLength={100}
          autoFocus
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Income type</FieldLabel>
          <Select
            items={scheduleOptions}
            value={form.values.scheduleType}
            onValueChange={(value) =>
              form.setValue("scheduleType", value as RevenueScheduleType)
            }
          >
            <SelectTrigger
              className="h-10 w-full px-3 data-[size=default]:h-10"
              aria-label="Income type"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scheduleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Category</FieldLabel>
          <Select
            items={revenueCategoryOptions}
            value={form.values.category}
            onValueChange={(value) =>
              form.setValue("category", value as RevenueCategory)
            }
          >
            <SelectTrigger
              className="h-10 w-full px-3 data-[size=default]:h-10"
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
      </div>
    </>
  )
}
