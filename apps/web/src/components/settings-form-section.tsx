import type { ReactNode } from "react"

import { cn } from "@trackfi/ui/lib/utils"

export function SettingsSectionHeading({
  description,
  icon,
  title,
}: {
  description: string
  icon: ReactNode
  title: string
}) {
  return (
    <div className="flex items-center gap-3.5 px-5 py-4 sm:px-6 sm:py-5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted [&>svg]:size-[18px]">
        {icon}
      </span>
      <div className="min-w-0 space-y-0.5">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-[13px] text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export function SettingsFormFeedback({
  error,
  message,
}: {
  error: string
  message: string
}) {
  if (!error && !message) return null
  return (
    <p
      role={error ? "alert" : "status"}
      className={cn("text-xs", error ? "text-destructive" : "text-foreground")}
    >
      {error || message}
    </p>
  )
}
