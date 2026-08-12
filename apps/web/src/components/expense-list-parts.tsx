import { ReceiptTextIcon } from "lucide-react"

import { Badge } from "@trackfi/ui/components/badge"
import { cn } from "@trackfi/ui/lib/utils"

import type { Expense } from "../lib/expenses"
import { displayLabel } from "../lib/subscriptions"

export function ExpenseIcon() {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-[7px] bg-orange-500/10 text-orange-700 dark:text-orange-400">
      <ReceiptTextIcon className="size-4" aria-hidden="true" />
    </span>
  )
}

export function ExpenseStatusBadge({ expense }: { expense: Expense }) {
  const elapsed =
    expense.status === "active" &&
    expense.scheduleType === "scheduled" &&
    expense.cadence === "once" &&
    !expense.nextExpenseDate
  const oneTime =
    expense.status === "active" && expense.cadence === "once" && !elapsed
  const scheduled =
    expense.status === "active" &&
    expense.scheduleType === "scheduled" &&
    expense.cadence !== "once"
  const estimated =
    expense.status === "active" && expense.scheduleType === "variable"
  const label = elapsed
    ? "Elapsed"
    : oneTime
      ? "One-time"
      : scheduled
        ? "Scheduled"
        : estimated
          ? "Estimated"
          : displayLabel(expense.status)
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto gap-1.5 border-transparent px-[9px] py-[5px] leading-none",
        (scheduled || oneTime) &&
          "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
        estimated && "bg-amber-50 text-amber-700 dark:bg-amber-950/50",
        (elapsed || expense.status !== "active") &&
          "bg-muted text-muted-foreground"
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </Badge>
  )
}
