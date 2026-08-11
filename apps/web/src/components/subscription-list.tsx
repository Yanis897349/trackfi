import {
  type Subscription,
  type SubscriptionStatus,
} from "../lib/subscriptions"
import { SubscriptionListDesktop } from "./subscription-list-desktop"
import { SubscriptionListMobile } from "./subscription-list-mobile"

export function SubscriptionList({
  subscriptions,
  currency,
  page,
  total,
  onPageChange,
  onEdit,
  onStatus,
  onDelete,
}: {
  subscriptions: Subscription[]
  currency: string
  page: number
  total: number
  onPageChange(page: number): void
  onEdit(subscription: Subscription): void
  onStatus(subscription: Subscription, status: SubscriptionStatus): void
  onDelete(subscription: Subscription): void
}) {
  const pageSize = 3
  const shown = Math.min(page * pageSize, total)
  const pagination = {
    shown,
    total,
    hasPrevious: page > 1,
    hasNext: shown < total,
    onPrevious: () => onPageChange(page - 1),
    onNext: () => onPageChange(page + 1),
  }
  const actions = { onEdit, onStatus, onDelete }

  return (
    <>
      <SubscriptionListDesktop
        subscriptions={subscriptions}
        currency={currency}
        {...pagination}
        {...actions}
      />
      <SubscriptionListMobile
        subscriptions={subscriptions}
        currency={currency}
        {...pagination}
        {...actions}
      />
    </>
  )
}
