import {
  BriefcaseBusinessIcon,
  Building2Icon,
  ChartNoAxesColumnIncreasingIcon,
  HandHeartIcon,
  HouseIcon,
  LandmarkIcon,
  SparklesIcon,
  StoreIcon,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@trackfi/ui/components/badge"
import { cn } from "@trackfi/ui/lib/utils"

import type { RevenueSource } from "../lib/revenue"
import { displayLabel } from "../lib/subscriptions"

export interface RevenueListPagination {
  shown: number
  total: number
  hasPrevious: boolean
  hasNext: boolean
  onPrevious(): void
  onNext(): void
}

const categoryIcons: Record<RevenueSource["category"], LucideIcon> = {
  salary: Building2Icon,
  freelance: BriefcaseBusinessIcon,
  business: StoreIcon,
  rental: HouseIcon,
  investments: ChartNoAxesColumnIncreasingIcon,
  benefits: HandHeartIcon,
  pension: LandmarkIcon,
  other: SparklesIcon,
}

export function RevenueSourceIcon({
  category = "other",
}: {
  category?: RevenueSource["category"]
}) {
  const Icon = categoryIcons[category]
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-[7px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
      <Icon className="size-4" aria-hidden="true" />
    </span>
  )
}

export function RevenueStatusBadge({ source }: { source: RevenueSource }) {
  const oneTime =
    source.status === "active" &&
    source.scheduleType === "scheduled" &&
    source.cadence === "once"
  const scheduled =
    source.status === "active" &&
    source.scheduleType === "scheduled" &&
    source.cadence !== "once"
  const estimated =
    source.status === "active" && source.scheduleType === "variable"
  const label = oneTime
    ? "One-time"
    : scheduled
      ? "Scheduled"
      : estimated
        ? "Estimated"
        : displayLabel(source.status)

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto gap-1.5 border-transparent px-[9px] py-[5px] leading-none",
        (scheduled || oneTime) &&
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
        estimated &&
          "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
        source.status === "paused" && "bg-muted text-muted-foreground",
        source.status === "archived" && "bg-muted/60 text-muted-foreground"
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </Badge>
  )
}
