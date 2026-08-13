import { Card, CardFooter } from "@trackfi/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@trackfi/ui/components/table"

import { formatDateOnly } from "../lib/date"
import {
  cadenceSuffix,
  subscriptionSecondaryLabel,
} from "../lib/subscription-list"
import {
  displayLabel,
  formatMoney,
  type Subscription,
} from "../lib/subscriptions"
import { SubscriptionActions } from "./subscription-actions"
import { BrandLogo, SubscriptionPreview } from "./subscription-brand"
import {
  SubscriptionPagination,
  type SubscriptionListActions,
  SubscriptionStatusBadge,
} from "./subscription-list-parts"
import { m } from "../lib/i18n"

export function SubscriptionListDesktop({
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
    <Card className="hidden gap-0 py-0 md:flex">
      <Table className="text-[13px]">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">{m.subscriptions_service()}</TableHead>
            <TableHead className="w-[150px]">
              {m.subscriptions_category()}
            </TableHead>
            <TableHead className="w-[180px]">
              {m.subscriptions_cost()}
            </TableHead>
            <TableHead className="w-[170px]">
              {m.subscriptions_next_renewal()}
            </TableHead>
            <TableHead className="w-[120px]">{m.common_status()}</TableHead>
            <TableHead className="w-16">
              <span className="sr-only">{m.common_actions()}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((subscription) => (
            <TableRow key={subscription.id} className="h-[72px]">
              <TableCell className="pl-4">
                <div className="flex items-center gap-3">
                  <SubscriptionPreview
                    currency={currency}
                    details={{
                      ...subscription,
                      renewalDate: subscription.nextRenewalDate,
                    }}
                  >
                    <BrandLogo
                      name={subscription.name}
                      websiteUrl={subscription.websiteUrl}
                      className="size-9 bg-transparent [&>span]:p-1"
                    />
                  </SubscriptionPreview>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{subscription.name}</p>
                    <p className="max-w-52 truncate text-xs text-muted-foreground">
                      {subscriptionSecondaryLabel(subscription)}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{displayLabel(subscription.category)}</TableCell>
              <TableCell className="font-medium">
                {formatMoney(subscription.amountMinor, currency)} /{" "}
                {cadenceSuffix(subscription.cadence)}
              </TableCell>
              <TableCell>
                {formatDateOnly(subscription.nextRenewalDate)}
              </TableCell>
              <TableCell>
                <SubscriptionStatusBadge status={subscription.status} />
              </TableCell>
              <TableCell className="text-right">
                <SubscriptionActions
                  subscription={subscription}
                  onEdit={onEdit}
                  onStatus={onStatus}
                  onDelete={onDelete}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <CardFooter className="h-14 justify-between bg-card px-4 py-0">
        <p className="text-xs text-muted-foreground">
          {m.subscriptions_count({ shown, total })}
        </p>
        <SubscriptionPagination
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={onPrevious}
          onNext={onNext}
        />
      </CardFooter>
    </Card>
  )
}
