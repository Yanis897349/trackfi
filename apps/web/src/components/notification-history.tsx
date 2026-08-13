import { useNavigate } from "@tanstack/react-router"
import {
  BellIcon,
  CalendarDaysIcon,
  CheckCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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
import {
  NotificationDateHeader,
  NotificationEmptyState,
  NotificationItem,
  NotificationLoading,
} from "./notification-parts"

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
    <div className="space-y-6 md:px-1 md:pt-2">
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
              !data?.summary.unread || state.actions.markAllRead.isPending
            }
            onClick={() => state.actions.markAllRead.mutate()}
          >
            <CheckCheckIcon />
            {m.notifications_mark_all_read()}
          </Button>
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-[minmax(260px,1fr)_158px_158px_170px]">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-[13px] size-[17px] -translate-y-1/2 text-muted-foreground" />
          <Input
            value={state.search}
            onChange={(event) => state.setSearch(event.target.value)}
            placeholder={m.notifications_search()}
            aria-label={m.notifications_search_label()}
            className="h-[42px] px-[13px] pl-10 text-sm"
          />
        </div>
        <ExpenseFilterSelect
          label={m.notifications_all()}
          value={state.status}
          items={statusItems}
          onChange={(value) =>
            state.setStatus(value as NotificationStatusFilter)
          }
          className="h-[42px] w-full px-[13px] text-[13px] data-[size=default]:h-[42px]"
        />
        <ExpenseFilterSelect
          label={m.notifications_all_types()}
          value={state.type}
          items={typeItems}
          onChange={(value) => state.setType(value as NotificationType | "all")}
          className="h-[42px] w-full px-[13px] text-[13px] data-[size=default]:h-[42px]"
        />
        <ExpenseFilterSelect
          icon={CalendarDaysIcon}
          label={m.notifications_last_30_days()}
          value={state.range}
          items={rangeItems}
          onChange={(value) => state.setRange(value as NotificationRange)}
          className="h-[42px] w-full px-[13px] text-[13px] data-[size=default]:h-[42px]"
        />
      </div>

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex h-12 items-center justify-between bg-muted/50 px-4">
          <h3 className="text-sm font-semibold">{m.notifications_results()}</h3>
          <span className="text-xs text-muted-foreground">
            {m.notifications_result_count({ count: data?.total ?? 0 })}
          </span>
        </div>

        <div className="p-3">
          {state.query.isPending ? (
            <div className="overflow-hidden rounded-[10px] border">
              <NotificationLoading rows={6} />
            </div>
          ) : state.query.isError ? (
            <Empty className="min-h-80 rounded-[10px] border">
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
            <div className="overflow-hidden rounded-[10px] border">
              <NotificationEmptyState
                filtered={hasFilters || resolved.summary.total > 0}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid divide-y overflow-hidden rounded-[10px] border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
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
              <div className="overflow-hidden rounded-[10px] border">
                {groupNotifications(resolved.notifications).map((group) => (
                  <div key={group.date}>
                    <NotificationDateHeader
                      date={group.date}
                      count={group.items.length}
                      variant="history"
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
                <div className="flex flex-col gap-3 border-t bg-muted/30 px-4 py-[9px] text-[11px] font-medium text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
                  <HistoryPagination
                    page={state.page}
                    totalPages={Math.max(
                      1,
                      Math.ceil(resolved.total / resolved.pageSize)
                    )}
                    onPageChange={state.setPage}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
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
    <div className="flex items-center gap-2.5 px-4 py-3.5">
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

function HistoryPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange(page: number): void
}) {
  const firstPage = Math.max(1, Math.min(page - 1, totalPages - 2))
  const pages = Array.from(
    { length: Math.min(3, totalPages) },
    (_, index) => firstPage + index
  )

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="size-[30px]"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeftIcon />
        <span className="sr-only">{m.pagination_previous()}</span>
      </Button>
      {pages.map((pageNumber) => (
        <Button
          key={pageNumber}
          type="button"
          variant={pageNumber === page ? "default" : "outline"}
          size="icon-sm"
          className="size-[30px] text-[11px]"
          aria-current={pageNumber === page ? "page" : undefined}
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber}
        </Button>
      ))}
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="size-[30px]"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRightIcon />
        <span className="sr-only">{m.pagination_next()}</span>
      </Button>
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
