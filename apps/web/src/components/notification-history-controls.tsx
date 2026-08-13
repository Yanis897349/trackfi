import { CalendarDaysIcon, CheckCheckIcon, SearchIcon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import { Input } from "@trackfi/ui/components/input"

import type { NotificationHistoryState } from "../hooks/use-notifications"
import { m } from "../lib/i18n"
import type {
  NotificationRange,
  NotificationStatusFilter,
  NotificationType,
} from "../lib/notifications"
import { ExpenseFilterSelect } from "./expense-filter-controls"

export function NotificationHistoryHeader({
  state,
}: {
  state: NotificationHistoryState
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:h-16 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-[30px] leading-9 font-bold tracking-tight">
          {m.notifications_history()}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {m.notifications_history_description()}
        </p>
      </div>
      <div>
        <Button
          variant="outline"
          size="lg"
          className="h-9 px-3.5 text-[13px]"
          disabled={
            !state.query.data?.summary.unread ||
            state.actions.markAllRead.isPending
          }
          onClick={() => state.actions.markAllRead.mutate()}
        >
          <CheckCheckIcon />
          {m.notifications_mark_all_read()}
        </Button>
      </div>
    </div>
  )
}

export function NotificationHistoryFilters({
  state,
}: {
  state: NotificationHistoryState
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] lg:grid-cols-[minmax(260px,1fr)_145px_160px_170px]">
      <div className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={state.search}
          onChange={(event) => state.setSearch(event.target.value)}
          placeholder={m.notifications_search()}
          aria-label={m.notifications_search_label()}
          className="h-10 pl-9"
        />
      </div>
      <ExpenseFilterSelect
        label={m.notifications_all()}
        value={state.status}
        items={statusItems}
        onChange={(value) => state.setStatus(value as NotificationStatusFilter)}
      />
      <ExpenseFilterSelect
        label={m.notifications_all_types()}
        value={state.type}
        items={typeItems}
        onChange={(value) => state.setType(value as NotificationType | "all")}
      />
      <ExpenseFilterSelect
        icon={CalendarDaysIcon}
        label={m.notifications_last_30_days()}
        value={state.range}
        items={rangeItems}
        onChange={(value) => state.setRange(value as NotificationRange)}
      />
    </div>
  )
}

const statusItems = [
  { value: "all", label: m.notifications_all() },
  { value: "unread", label: m.notifications_unread() },
  { value: "read", label: m.notifications_read() },
]

const typeItems = [
  { value: "all", label: m.notifications_all_types() },
  {
    value: "expense_budget_approaching",
    label: m.notifications_type_approaching(),
  },
  {
    value: "expense_budget_limit",
    label: m.notifications_type_limit(),
  },
]

const rangeItems = [
  { value: "7d", label: m.notifications_last_7_days() },
  { value: "30d", label: m.notifications_last_30_days() },
  { value: "90d", label: m.notifications_last_90_days() },
  { value: "all", label: m.notifications_all_time() },
]
