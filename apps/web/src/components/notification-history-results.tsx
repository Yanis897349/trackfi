import { BellIcon, CalendarDaysIcon, InboxIcon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@trackfi/ui/components/empty"
import { StableLoadingPlaceholder } from "@trackfi/ui/components/stable-loading-placeholder"
import { useStableLoadingState } from "@trackfi/ui/hooks/use-stable-loading-state"

import type { NotificationHistoryState } from "../hooks/use-notifications"
import { m } from "../lib/i18n"
import {
  groupNotifications,
  type Notification,
  type NotificationListResponse,
} from "../lib/notifications"
import { NotificationDateHeader } from "./notification-date-header"
import { NotificationHistoryPagination } from "./notification-history-pagination"
import { NotificationItem } from "./notification-item"
import {
  NotificationEmptyState,
  NotificationLoading,
} from "./notification-states"

export function NotificationHistoryResults({
  state,
  data,
  hasFilters,
  onOpen,
}: {
  state: NotificationHistoryState
  data: NotificationListResponse
  hasFilters: boolean
  onOpen(notification: Notification): void
}) {
  const loading = useStableLoadingState({
    isLoading: state.query.isLoading,
    isError: state.query.isError,
  })

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="flex h-12 items-center justify-between bg-muted/50 px-4">
        <h3 className="text-sm font-semibold">{m.notifications_results()}</h3>
        <span className="text-xs text-muted-foreground">
          {m.notifications_result_count({
            count: state.query.data?.total ?? 0,
          })}
        </span>
      </div>

      <div className="p-3">
        {state.query.isError ? (
          <NotificationHistoryError
            onRetry={() => void state.query.refetch()}
          />
        ) : loading.shouldRender ? (
          <StableLoadingPlaceholder isVisible={loading.isVisible}>
            <div className="overflow-hidden rounded-[10px] border">
              <NotificationLoading rows={6} />
            </div>
          </StableLoadingPlaceholder>
        ) : !data.notifications.length ? (
          <div className="overflow-hidden rounded-[10px] border">
            <NotificationEmptyState
              filtered={hasFilters || data.summary.total > 0}
            />
          </div>
        ) : (
          <NotificationHistoryContent
            state={state}
            data={data}
            onOpen={onOpen}
          />
        )}
      </div>
    </section>
  )
}

function NotificationHistoryContent({
  state,
  data,
  onOpen,
}: {
  state: NotificationHistoryState
  data: NotificationListResponse
  onOpen(notification: Notification): void
}) {
  return (
    <div className="space-y-4">
      <div className="grid divide-y overflow-hidden rounded-[10px] border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <HistorySummary
          icon={InboxIcon}
          value={data.summary.total}
          label={m.notifications_all()}
        />
        <HistorySummary
          icon={BellIcon}
          value={data.summary.unread}
          label={m.notifications_unread()}
        />
        <HistorySummary
          icon={CalendarDaysIcon}
          value={data.summary.thisWeek}
          label={m.notifications_this_week()}
        />
      </div>
      <div className="overflow-hidden rounded-[10px] border">
        {groupNotifications(data.notifications).map((group) => (
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
                onOpen={onOpen}
                onMarkRead={(item) => state.actions.markRead.mutate(item.id)}
              />
            ))}
          </div>
        ))}
        <div className="flex flex-col gap-3 border-t bg-muted/30 px-4 py-[9px] text-[11px] font-medium text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {m.notifications_showing({
              start: (data.page - 1) * data.pageSize + 1,
              end: Math.min(data.page * data.pageSize, data.total),
              total: data.total,
            })}
          </span>
          <NotificationHistoryPagination
            page={state.page}
            totalPages={Math.max(1, Math.ceil(data.total / data.pageSize))}
            onPageChange={state.setPage}
          />
        </div>
      </div>
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

function NotificationHistoryError({ onRetry }: { onRetry(): void }) {
  return (
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
      <Button variant="outline" onClick={onRetry}>
        {m.common_retry()}
      </Button>
    </Empty>
  )
}
