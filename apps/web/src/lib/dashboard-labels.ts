import type { DashboardActivity, DashboardModule } from "./dashboard"
import { m } from "./i18n"

export function dashboardModuleLabel(module: DashboardModule) {
  if (module === "expenses") return m.nav_expenses()
  if (module === "subscriptions") return m.nav_subscriptions()
  return m.nav_revenue()
}

export function dashboardActivityStatusLabel(activity: DashboardActivity) {
  if (activity.status === "approved") return m.dashboard_status_approved()
  if (activity.status === "pending") return m.dashboard_status_pending()
  if (activity.status === "estimated") return m.dashboard_status_estimated()
  return activity.module === "subscriptions"
    ? m.dashboard_status_renewal()
    : m.dashboard_status_scheduled()
}
