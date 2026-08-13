export const dashboardChartColors = {
  expenses: "var(--color-orange-500)",
  neutral: "#555552",
  revenue: "var(--color-emerald-500)",
  subscriptions: "var(--foreground)",
} as const

export function dashboardMovementColor(
  netMinor: number,
  index: number,
  length: number
) {
  if (netMinor < 0) return dashboardChartColors.expenses
  if (index === length - 1) return dashboardChartColors.revenue
  return dashboardChartColors.neutral
}
