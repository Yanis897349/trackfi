import { ExternalLinkIcon } from "lucide-react"

import { Badge } from "@trackfi/ui/components/badge"
import { Card, CardContent } from "@trackfi/ui/components/card"
import { formatDateOnly } from "../lib/date"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@trackfi/ui/components/table"

import {
  displayLabel,
  formatMoney,
  type Subscription,
  type SubscriptionStatus,
} from "../lib/subscriptions"
import { SubscriptionActions } from "./subscription-actions"

export function SubscriptionList({
  subscriptions,
  currency,
  onEdit,
  onStatus,
  onDelete,
}: {
  subscriptions: Subscription[]
  currency: string
  onEdit(subscription: Subscription): void
  onStatus(subscription: Subscription, status: SubscriptionStatus): void
  onDelete(subscription: Subscription): void
}) {
  return (
    <>
      <Card className="hidden py-0 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Service</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Next renewal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((subscription) => (
              <TableRow key={subscription.id}>
                <TableCell className="pl-4">
                  <div className="font-medium">{subscription.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {displayLabel(subscription.category)}
                  </div>
                </TableCell>
                <TableCell>
                  {formatMoney(subscription.amountMinor, currency)} /{" "}
                  {cadenceSuffix(subscription.cadence)}
                </TableCell>
                <TableCell>
                  {formatDateOnly(subscription.nextRenewalDate)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={subscription.status} />
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
      </Card>
      <div className="grid gap-3 md:hidden">
        {subscriptions.map((subscription) => (
          <Card key={subscription.id} size="sm">
            <CardContent className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{subscription.name}</p>
                  {subscription.websiteUrl && (
                    <a
                      href={subscription.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${subscription.name} website`}
                    >
                      <ExternalLinkIcon className="size-3.5 text-muted-foreground" />
                    </a>
                  )}
                </div>
                <p className="mt-1 text-sm">
                  {formatMoney(subscription.amountMinor, currency)} /{" "}
                  {cadenceSuffix(subscription.cadence)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Renews {formatDateOnly(subscription.nextRenewalDate)} ·{" "}
                  {displayLabel(subscription.category)}
                </p>
                <div className="mt-3">
                  <StatusBadge status={subscription.status} />
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
      </div>
    </>
  )
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <Badge variant={status === "active" ? "secondary" : "outline"}>
      {displayLabel(status)}
    </Badge>
  )
}

function cadenceSuffix(cadence: Subscription["cadence"]) {
  return (
    {
      weekly: "week",
      monthly: "month",
      quarterly: "quarter",
      semiannual: "6 months",
      yearly: "year",
    } as const
  )[cadence]
}
