import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"
import { Skeleton } from "@trackfi/ui/components/skeleton"

import { ModuleHeader } from "./module-layout"
import { SubscriptionListSkeleton } from "./subscription-list-skeleton"
import { m } from "../lib/i18n"

export function SubscriptionsLoadingState() {
  return (
    <section
      className="mx-auto w-full max-w-[1120px] space-y-6"
      role="status"
      aria-label={m.subscriptions_loading()}
      aria-busy="true"
    >
      <ModuleHeader
        title={m.nav_subscriptions()}
        description={m.module_subscriptions_description()}
        action={<Skeleton className="h-9 w-40" />}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} className="h-[126px]">
            <CardContent className="flex h-full flex-col justify-center gap-2.5 px-5">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="size-4" />
              </div>
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="gap-0 py-0 sm:h-[190px]">
        <CardHeader className="h-[68px] px-5 py-4">
          <CardTitle>{m.subscriptions_upcoming_renewals()}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 px-5 pt-2 pb-5 sm:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="rounded-lg bg-muted p-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-3 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex flex-col gap-3 sm:flex-row" aria-hidden="true">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-full sm:w-[150px]" />
        <Skeleton className="h-10 w-full sm:w-[150px]" />
      </div>
      <SubscriptionListSkeleton announce={false} />
    </section>
  )
}
