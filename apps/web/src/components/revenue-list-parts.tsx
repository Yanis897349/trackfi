import { BanknoteIcon } from "lucide-react"

import { Badge } from "@trackfi/ui/components/badge"

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

export function RevenueSourceIcon() {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-[7px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
      <BanknoteIcon className="size-4" />
    </span>
  )
}

export function RevenueStatusBadge({
  status,
}: {
  status: RevenueSource["status"]
}) {
  return (
    <Badge
      variant={status === "active" ? "secondary" : "outline"}
      className="h-auto gap-1.5 px-[9px] py-[5px] leading-none"
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {displayLabel(status)}
    </Badge>
  )
}
