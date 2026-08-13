import { useNavigate } from "@tanstack/react-router"
import {
  BellIcon,
  CalendarDaysIcon,
  CheckCheckIcon,
  InboxIcon,
  SearchIcon,
} from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@trackfi/ui/components/empty"
import { Input } from "@trackfi/ui/components/input"

import { useNotificationHistory } from "../hooks/use-notifications"
import { m } from "../lib/i18n"
import {
  groupNotifications,
  type Notification,
  type NotificationRange,
  type NotificationStatusFilter,
  type NotificationType,
} from "../lib/notifications"
import { ExpenseFilterSelect } from "./expense-filter-controls"
import { ModuleHeader } from "./module-layout"
import {
  NotificationDateHeader,
  NotificationEmptyState,
  NotificationItem,
  NotificationLoading,
} from "./notification-parts"
import { SubscriptionPagination } from "./subscription-list-parts"

export function NotificationHistory() {
  const state = useNotificationHistory()
  const navigate = useNavigate()
  const data = state.query.data
  const resolved = data ?? {
    notifications: [],
    page: state.page,
    pageSize: 6,
    total: 0,
    summary: { total: 0, unread: 0, thisWeek: 0 },
  }
  const hasFilters =
    Boolean(state.search) ||
    state.status !== "all" ||
    state.type !== "all" ||
    state.range !== "30d"

  function openNotification(notification: Notification) {
    if (!notification.readAt) state.actions.markRead.mutate(notification.id)
    void navigate({ to: notification.actionPath })
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title={m.notifications_history()}
        description={m.notifications_history_description()}
        action={
          <Button
            variant="outline"
            disabled={
              !data?.summary.unread || state.actions.markAllRead.isPending
            }
            onClick={() => state.actions.markAllRead.mutate()}
          >
            <CheckCheckIcon />
            {m.notifications_mark_all_read()}
          </Button>
        }
      />

      <div className="grid gap-2 lg:grid-cols-[minmax(260px,1fr)_158px_158px_170px]">
        <div className="relative">
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
          onChange={(value) =>
            state.setStatus(value as NotificationStatusFilter)
          }
          className="w-full"
        />
        <ExpenseFilterSelect
          label={m.notifications_all_types()}
          value={state.type}
          items={typeItems}
          onChange={(value) => state.setType(value as NotificationType | "all")}
          className="w-full"
        />
        <ExpenseFilterSelect
          icon={CalendarDaysIcon}
          label={m.notifications_last_30_days()}
          value={state.range}
          items={rangeItems}
          onChange={(value) => state.setRange(value as NotificationRange)}
          className="w-full"
        />
      </div>

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex h-12 items-center justify-between bg-muted/50 px-4">
          <h3 className="text-sm font-semibold">{m.notifications_results()}</h3>
          <span className="text-xs text-muted-foreground">
            {m.notifications_result_count({ count: data?.total ?? 0 })}
          </span>
        </div>

        {state.query.isPending ? (
          <NotificationLoading rows={6} />
        ) : state.query.isError ? (
          <Empty className="min-h-80 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BellIcon />
              </EmptyMedia>
              <EmptyTitle>{m.notifications_error_title()}</EmptyTitle>
              <EmptyDescription>
                {m.notifications_error_description()}
              </EmptyDescription>
            </EmptyHeader>
            <Button
              variant="outline"
              onClick={() => void state.query.refetch()}
            >
              {m.common_retry()}
            </Button>
          </Empty>
        ) : !resolved.notifications.length ? (
          <NotificationEmptyState
            filtered={hasFilters || resolved.summary.total > 0}
          />
        ) : (
          <>
            <div className="grid divide-y border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <HistorySummary
                icon={InboxIcon}
                value={resolved.summary.total}
                label={m.notifications_all()}
              />
              <HistorySummary
                icon={BellIcon}
                value={resolved.summary.unread}
                label={m.notifications_unread()}
              />
              <HistorySummary
                icon={CalendarDaysIcon}
                value={resolved.summary.thisWeek}
                label={m.notifications_this_week()}
              />
            </div>
            <div>
              {groupNotifications(resolved.notifications).map((group) => (
                <div key={group.date}>
                  <NotificationDateHeader
                    date={group.date}
                    count={group.items.length}
                  />
                  {group.items.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      variant="history"
                      onOpen={openNotification}
                      onMarkRead={(item) =>
                        state.actions.markRead.mutate(item.id)
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 bg-muted/30 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                {m.notifications_showing({
                  start: (resolved.page - 1) * resolved.pageSize + 1,
                  end: Math.min(
                    resolved.page * resolved.pageSize,
                    resolved.total
                  ),
                  total: resolved.total,
                })}
              </span>
              <SubscriptionPagination
                hasPrevious={state.page > 1}
                hasNext={state.page * resolved.pageSize < resolved.total}
                onPrevious={() => state.setPage(state.page - 1)}
                onNext={() => state.setPage(state.page + 1)}
              />
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function HistorySummary({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof BellIcon
  value: number
  label: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4" />
      </span>
      <span>
        <strong className="block text-base leading-none">{value}</strong>
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </span>
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
