import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"
import { Skeleton } from "@trackfi/ui/components/skeleton"

import { ModuleHeader } from "./module-layout"
import { SubscriptionListSkeleton } from "./subscription-list-skeleton"

export function SubscriptionsLoadingState() {
  return (
    <section
      className="mx-auto w-full max-w-6xl space-y-6"
      role="status"
      aria-label="Loading subscriptions"
      aria-busy="true"
    >
      <ModuleHeader
        title="Subscriptions"
        description="Track recurring services, costs, and renewal dates."
        action={<Skeleton className="h-8 w-36" />}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} size="sm">
            <CardContent className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming renewals</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="rounded-lg bg-muted/60 p-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-3 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex flex-col gap-3 sm:flex-row" aria-hidden="true">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-full sm:w-36" />
        <Skeleton className="h-8 w-full sm:w-40" />
      </div>
      <SubscriptionListSkeleton announce={false} />
    </section>
  )
}
