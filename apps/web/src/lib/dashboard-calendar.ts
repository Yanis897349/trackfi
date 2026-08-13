import type { DashboardActivity } from "./dashboard"

export function activityTone(module: DashboardActivity["module"]) {
  if (module === "revenue") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  }
  if (module === "expenses") {
    return "bg-orange-500/10 text-orange-700 dark:text-orange-300"
  }
  return "bg-violet-500/10 text-violet-700 dark:text-violet-300"
}
