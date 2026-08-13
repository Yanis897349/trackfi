import { cn } from "@trackfi/ui/lib/utils"

import { dateOnlyGroupLabel } from "../lib/date"
import { m } from "../lib/i18n"

export function NotificationDateHeader({
  date,
  count,
  variant,
}: {
  date: string
  count?: number
  variant: "history" | "inbox"
}) {
  const label = dateOnlyGroupLabel(date, {
    today: m.notifications_today(),
    yesterday: m.notifications_yesterday(),
  })

  return (
    <div
      className={cn(
        "flex items-center justify-between bg-muted/50 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase",
        variant === "inbox" ? "px-5 pt-3 pb-2" : "px-4 py-2"
      )}
    >
      <span>
        {variant === "history"
          ? `${label.relative ?? label.weekday} · ${label.date}`
          : (label.relative ?? label.weekday)}
      </span>
      {variant === "inbox" ? (
        <span className="font-medium">{label.date}</span>
      ) : (
        count !== undefined && (
          <span className="font-medium normal-case">
            {m.notifications_result_count({ count })}
          </span>
        )
      )}
    </div>
  )
}
