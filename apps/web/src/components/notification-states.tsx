import { GaugeIcon } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@trackfi/ui/components/empty"
import { Skeleton } from "@trackfi/ui/components/skeleton"

import { m } from "../lib/i18n"

export function NotificationLoading({ rows = 4 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-label={m.notifications_loading()}
      className="divide-y"
    >
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-9 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function NotificationEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <Empty className="min-h-48 border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <GaugeIcon />
        </EmptyMedia>
        <EmptyTitle>
          {filtered
            ? m.notifications_no_match_title()
            : m.notifications_empty_title()}
        </EmptyTitle>
        <EmptyDescription>
          {filtered
            ? m.notifications_no_match_description()
            : m.notifications_empty_description()}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
