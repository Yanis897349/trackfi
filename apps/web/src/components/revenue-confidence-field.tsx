import { Field, FieldLabel } from "@trackfi/ui/components/field"
import { cn } from "@trackfi/ui/lib/utils"

import type { RevenueFormState } from "../hooks/use-revenue-form"
import type { RevenueScheduleType } from "../lib/revenue"

const confidenceOptions: Array<{
  value: RevenueScheduleType
  label: string
  description: string
}> = [
  {
    value: "scheduled",
    label: "Confirmed",
    description: "A scheduled payment you can rely on",
  },
  {
    value: "variable",
    label: "Estimate",
    description: "Variable income based on your best forecast",
  },
]

export function RevenueConfidenceField({ form }: { form: RevenueFormState }) {
  return (
    <Field className="gap-2">
      <FieldLabel id="revenue-confidence-label">Confidence</FieldLabel>
      <div
        className="grid gap-2.5 sm:grid-cols-2"
        role="radiogroup"
        aria-labelledby="revenue-confidence-label"
      >
        {confidenceOptions.map((option) => {
          const selected = form.values.scheduleType === option.value
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-[72px] cursor-pointer items-center gap-2.5 rounded-lg border-[1.5px] p-3 transition-colors",
                !selected && "border-border bg-background hover:bg-muted/50",
                selected &&
                  option.value === "scheduled" &&
                  "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50",
                selected &&
                  option.value === "variable" &&
                  "border-orange-500 bg-orange-50 dark:bg-orange-950/50"
              )}
            >
              <input
                type="radio"
                name="revenue-confidence"
                value={option.value}
                checked={selected}
                onChange={() => form.setValue("scheduleType", option.value)}
                className={cn(
                  "size-4 shrink-0 appearance-none rounded-full border-[1.5px] border-muted-foreground/60 bg-background outline-none focus-visible:ring-3",
                  option.value === "scheduled" &&
                    "checked:border-emerald-600 checked:bg-emerald-600 focus-visible:ring-emerald-500/30",
                  option.value === "variable" &&
                    "checked:border-orange-600 checked:bg-orange-600 focus-visible:ring-orange-500/30"
                )}
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </Field>
  )
}
