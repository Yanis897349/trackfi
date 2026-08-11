import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"
import { Skeleton } from "@trackfi/ui/components/skeleton"

import { ModuleHeader } from "./module-layout"

export function SettingsLoadingState() {
  return (
    <section
      className="mx-auto w-full max-w-3xl space-y-6"
      role="status"
      aria-label="Loading settings"
      aria-busy="true"
    >
      <ModuleHeader
        title="Settings"
        description="Manage preferences shared by every Trackfi module."
      />
      <Card>
        <CardHeader>
          <CardTitle>Account currency</CardTitle>
        </CardHeader>
        <CardContent className="max-w-lg space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <Skeleton className="h-8 w-28" />
        </CardContent>
      </Card>
    </section>
  )
}
