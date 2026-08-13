import type { ReactNode } from "react"
import { Link } from "@tanstack/react-router"
import { ArrowUpRightIcon } from "lucide-react"

import { Card } from "@trackfi/ui/components/card"

import type { DashboardModule, DashboardSeriesEntry } from "../lib/dashboard"
import { dashboardModuleLabel } from "../lib/dashboard-labels"
import { m } from "../lib/i18n"
import {
  DashboardModuleSparkChart,
  type DashboardModuleAccent,
} from "./dashboard-module-spark-chart"

export function DashboardModuleCard({
  module,
  icon,
  href,
  kicker,
  value,
  note,
  series,
  accent,
  currency,
}: {
  module: DashboardModule
  icon: ReactNode
  href:
    "/dashboard/subscriptions" | "/dashboard/expenses" | "/dashboard/revenue"
  kicker: string
  value: string
  note: string
  series: DashboardSeriesEntry[]
  accent: DashboardModuleAccent
  currency: string
}) {
  const label = dashboardModuleLabel(module)
  return (
    <Link
      to={href}
      aria-label={m.dashboard_open_module({ module: label })}
      className="group relative z-0 rounded-[10px] outline-none hover:z-10 focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full gap-2.5 overflow-visible p-4 transition-colors group-hover:bg-muted/20 motion-reduce:transition-none">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className="[&_svg]:size-4">{icon}</span>
            {label}
          </span>
          <ArrowUpRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none" />
        </div>
        <p className="mt-0.5 text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          {kicker}
        </p>
        <p className="font-mono text-xl font-semibold tracking-[-0.035em]">
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground">{note}</p>
        <DashboardModuleSparkChart
          series={series}
          accent={accent}
          currency={currency}
          label={label}
        />
      </Card>
    </Link>
  )
}
