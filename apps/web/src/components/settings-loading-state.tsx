import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"
import { Skeleton } from "@trackfi/ui/components/skeleton"

import { ModuleHeader } from "./module-layout"
import { m } from "../lib/i18n"

export function SettingsLoadingState() {
  return (
    <section
      className="mx-auto w-full max-w-3xl space-y-6"
      role="status"
      aria-label={m.settings_loading()}
      aria-busy="true"
    >
      <ModuleHeader
        title={m.settings_title()}
        description={m.settings_description()}
      />
      <Card>
        <CardHeader>
          <CardTitle>{m.settings_account_currency()}</CardTitle>
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
