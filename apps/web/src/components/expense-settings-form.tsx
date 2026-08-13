import { useState, type FormEvent } from "react"

import { DateOnlyPicker } from "@trackfi/ui/components/date-only-picker"
import { Field, FieldError, FieldLabel } from "@trackfi/ui/components/field"
import { Switch } from "@trackfi/ui/components/switch"

import { currencySymbol } from "../lib/currency"
import { currentMonthDateOnly } from "../lib/date"
import type { ExpenseSettings } from "../lib/expenses"
import { dateFnsLocale, intlLocale, m } from "../lib/i18n"
import {
  ExpenseMoneyField,
  ExpensePercentField,
} from "./expense-settings-fields"

export const expenseSettingsFormId = "expense-settings-form"

export function ExpenseSettingsForm({
  currency,
  settings,
  error,
  onSave,
}: {
  currency: string
  settings: ExpenseSettings
  error: string
  onSave(settings: ExpenseSettings): void
}) {
  const fractionDigits =
    new Intl.NumberFormat(intlLocale(), {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  const divisor = 10 ** fractionDigits
  const [budget, setBudget] = useState(
    settings.monthlyBudgetMinor === null
      ? ""
      : (settings.monthlyBudgetMinor / divisor).toFixed(fractionDigits)
  )
  const [dailyTarget, setDailyTarget] = useState(
    settings.dailyTargetMinor === null
      ? ""
      : (settings.dailyTargetMinor / divisor).toFixed(fractionDigits)
  )
  const [resetDay, setResetDay] = useState(settings.resetDay)
  const [rolloverEnabled, setRolloverEnabled] = useState(
    settings.rolloverEnabled
  )
  const [approachingThreshold, setApproachingThreshold] = useState(
    String(settings.approachingThreshold)
  )
  const [limitThreshold, setLimitThreshold] = useState(
    String(settings.limitThreshold)
  )
  const [validation, setValidation] = useState("")

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const budgetValue = optionalNumber(budget)
    const dailyValue = optionalNumber(dailyTarget)
    const approaching = Number(approachingThreshold)
    const limit = Number(limitThreshold)
    if (
      (budgetValue !== null &&
        (!Number.isFinite(budgetValue) || budgetValue <= 0)) ||
      (dailyValue !== null &&
        (!Number.isFinite(dailyValue) || dailyValue <= 0)) ||
      !Number.isInteger(approaching) ||
      !Number.isInteger(limit) ||
      approaching < 1 ||
      approaching >= limit ||
      limit > 200
    ) {
      setValidation(m.expenses_budget_validation())
      return
    }
    setValidation("")
    onSave({
      ...settings,
      monthlyBudgetMinor:
        budgetValue === null ? null : Math.round(budgetValue * divisor),
      dailyTargetMinor:
        dailyValue === null ? null : Math.round(dailyValue * divisor),
      resetDay,
      rolloverEnabled,
      approachingThreshold: approaching,
      limitThreshold: limit,
    })
  }

  return (
    <form id={expenseSettingsFormId} className="space-y-5" onSubmit={submit}>
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">
            {m.expenses_budget_and_pace()}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {m.expenses_budget_pace_description()}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ExpenseMoneyField
            id="monthly-budget"
            label={m.expenses_monthly_budget()}
            value={budget}
            symbol={currencySymbol(currency)}
            step={1 / divisor}
            onChange={setBudget}
          />
          <ExpenseMoneyField
            id="daily-target"
            label={m.expenses_daily_target()}
            value={dailyTarget}
            symbol={currencySymbol(currency)}
            step={1 / divisor}
            onChange={setDailyTarget}
          />
        </div>
      </section>
      <section className="space-y-3 border-t pt-4">
        <div>
          <h3 className="text-sm font-semibold">
            {m.expenses_budget_period()}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {m.expenses_budget_period_description()}
          </p>
        </div>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="expense-reset-day">
            {m.expenses_reset_day()}
          </FieldLabel>
          <DateOnlyPicker
            id="expense-reset-day"
            value={currentMonthDateOnly(resetDay)}
            disabled={(date) => date.getDate() > 28}
            onChange={(value) => setResetDay(Number(value.slice(-2)))}
            locale={dateFnsLocale()}
            placeholder={m.calendar_pick_date()}
          />
        </Field>
        <div className="flex items-center justify-between gap-4 border-t pt-4">
          <div>
            <p className="text-xs font-medium">{m.expenses_rollover()}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {m.expenses_rollover_description()}
            </p>
          </div>
          <Switch
            aria-label={m.expenses_rollover_label()}
            checked={rolloverEnabled}
            className="focus-visible:border-orange-500 focus-visible:ring-orange-500/30 data-checked:bg-[#F4510B]"
            onCheckedChange={setRolloverEnabled}
          />
        </div>
      </section>
      <section className="space-y-3 border-t pt-4">
        <div>
          <h3 className="text-sm font-semibold">
            {m.expenses_alert_thresholds()}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {m.expenses_thresholds_description()}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ExpensePercentField
            id="approaching-budget"
            label={m.expenses_approaching_budget()}
            value={approachingThreshold}
            warning
            onChange={setApproachingThreshold}
          />
          <ExpensePercentField
            id="budget-limit"
            label={m.expenses_budget_limit()}
            value={limitThreshold}
            onChange={setLimitThreshold}
          />
        </div>
      </section>
      {(validation || error) && <FieldError>{validation || error}</FieldError>}
    </form>
  )
}

function optionalNumber(value: string) {
  return value.trim() ? Number(value) : null
}
