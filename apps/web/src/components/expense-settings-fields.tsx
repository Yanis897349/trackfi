import { Field, FieldLabel } from "@trackfi/ui/components/field"
import { Input } from "@trackfi/ui/components/input"

export function ExpenseMoneyField({
  id,
  label,
  value,
  symbol,
  step,
  onChange,
}: {
  id: string
  label: string
  value: string
  symbol: string
  step: number
  onChange(value: string): void
}) {
  return (
    <Field className="gap-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
          {symbol}
        </span>
        <Input
          id={id}
          type="number"
          min={step}
          step={step}
          className="h-10 pl-8"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </Field>
  )
}

export function ExpensePercentField({
  id,
  label,
  value,
  warning = false,
  onChange,
}: {
  id: string
  label: string
  value: string
  warning?: boolean
  onChange(value: string): void
}) {
  return (
    <Field className="gap-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          required
          type="number"
          min={1}
          max={200}
          className={
            warning
              ? "h-10 border-orange-300 bg-orange-50 pr-8 focus-visible:border-orange-500 focus-visible:ring-orange-500/20 dark:border-orange-700 dark:bg-orange-950/50 dark:focus-visible:border-orange-500"
              : "h-10 pr-8"
          }
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span
          className={
            warning
              ? "absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-orange-800 dark:text-orange-300"
              : "absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground"
          }
        >
          %
        </span>
      </div>
    </Field>
  )
}
