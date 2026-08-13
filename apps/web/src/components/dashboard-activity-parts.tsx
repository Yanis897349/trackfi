import { Badge } from "@trackfi/ui/components/badge"
import { cn } from "@trackfi/ui/lib/utils"

import type { DashboardActivity } from "../lib/dashboard"
import { dashboardActivityStatusLabel } from "../lib/dashboard-labels"
import { formatMoney } from "../lib/currency"

export function DashboardActivityAmount({
  activity,
  currency,
}: {
  activity: DashboardActivity
  currency: string
}) {
  return (
    <span
      className={cn(
        "shrink-0 font-mono text-xs font-semibold",
        activity.direction === "in" && "text-emerald-600 dark:text-emerald-400",
        activity.direction === "out" &&
          activity.module === "expenses" &&
          "text-orange-600 dark:text-orange-400"
      )}
    >
      {activity.direction === "in" ? "+" : "−"}
      {formatMoney(activity.amountMinor, currency)}
    </span>
  )
}

export function DashboardActivityStatus({
  activity,
}: {
  activity: DashboardActivity
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "h-6 rounded-md border-0 px-2 text-[10px]",
        activityStatusColor(activity)
      )}
      data-status={activity.status}
    >
      {dashboardActivityStatusLabel(activity)}
    </Badge>
  )
}

function activityStatusColor(activity: DashboardActivity) {
  if (activity.module === "expenses") {
    return "bg-[#F6F6F4] text-[#FF7A00] dark:bg-[#F6F6F4] dark:text-[#FF7A00]"
  }
  if (activity.module === "subscriptions") {
    return "bg-[#F6F6F4] text-[#111111] dark:bg-[#F6F6F4] dark:text-[#111111]"
  }
  return "bg-[#E7FAF3] text-[#00A876] dark:bg-[#E7FAF3] dark:text-[#00A876]"
}
