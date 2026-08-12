import { Card, CardContent } from "@trackfi/ui/components/card"
import { Skeleton } from "@trackfi/ui/components/skeleton"
import { m } from "../lib/i18n"

export function FeatureFlagsLoadingState() {
  return (
    <section
      className="mx-auto w-full max-w-4xl space-y-6"
      role="status"
      aria-label={m.admin_loading_feature_flags()}
      aria-busy="true"
    >
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {m.admin_feature_flags_title()}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {m.admin_feature_flags_description()}
        </p>
      </div>
      <Card>
        <CardContent className="flex items-start justify-between gap-6 py-1">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full max-w-xl" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-[18px] w-8 rounded-full" />
        </CardContent>
      </Card>
    </section>
  )
}
