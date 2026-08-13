import { Skeleton } from "@trackfi/ui/components/skeleton"

import { m } from "../lib/i18n"

export function SettingsLoadingState({
  tab,
}: {
  tab: "general" | "notifications" | "security"
}) {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-label={m.settings_loading()}
      aria-busy="true"
    >
      <div className="space-y-2">
        <div className="flex justify-between gap-4">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-7 w-32 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="overflow-hidden rounded-[10px] border">
        <div className="space-y-2 p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        {Array.from({ length: tab === "notifications" ? 2 : 3 }).map(
          (_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-8 border-t p-6"
            >
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full max-w-sm" />
              </div>
              <Skeleton className="h-9 w-40" />
            </div>
          )
        )}
      </div>
    </div>
  )
}
