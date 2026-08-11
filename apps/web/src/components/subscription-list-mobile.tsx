import { Card, CardContent } from "@trackfi/ui/components/card"

import { formatDateOnly } from "../lib/date"
import { cadenceSuffix } from "../lib/subscription-list"
import {
  displayLabel,
  formatMoney,
  type Subscription,
} from "../lib/subscriptions"
import { SubscriptionActions } from "./subscription-actions"
import { SubscriptionPreview } from "./subscription-brand"
import {
  SubscriptionPagination,
  type SubscriptionListActions,
  SubscriptionStatusBadge,
} from "./subscription-list-parts"

export function SubscriptionListMobile({
  subscriptions,
  currency,
  shown,
  total,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onEdit,
  onStatus,
  onDelete,
}: {
  subscriptions: Subscription[]
  currency: string
  shown: number
  total: number
  hasPrevious: boolean
  hasNext: boolean
  onPrevious(): void
  onNext(): void
} & SubscriptionListActions) {
  return (
    <div className="grid gap-3 md:hidden">
      {subscriptions.map((subscription) => (
        <Card key={subscription.id} size="sm">
          <CardContent className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <SubscriptionPreview
                currency={currency}
                details={{
                  ...subscription,
                  renewalDate: subscription.nextRenewalDate,
                }}
              />
              <div className="min-w-0">
                <p className="truncate font-medium">{subscription.name}</p>
                <p className="mt-1 text-sm">
                  {formatMoney(subscription.amountMinor, currency)} /{" "}
                  {cadenceSuffix(subscription.cadence)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Renews {formatDateOnly(subscription.nextRenewalDate)} ·{" "}
                  {displayLabel(subscription.category)}
                </p>
                <div className="mt-3">
                  <SubscriptionStatusBadge status={subscription.status} />
                </div>
              </div>
            </div>
            <SubscriptionActions
              subscription={subscription}
              onEdit={onEdit}
              onStatus={onStatus}
              onDelete={onDelete}
            />
          </CardContent>
        </Card>
      ))}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-muted-foreground">
          {shown} of {total} subscriptions
        </p>
        <SubscriptionPagination
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={onPrevious}
          onNext={onNext}
        />
      </div>
    </div>
  )
}
