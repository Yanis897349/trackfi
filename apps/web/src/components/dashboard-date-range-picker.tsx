import { useState } from "react"
import { format } from "date-fns"
import { CalendarDaysIcon, ChevronDownIcon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import { Calendar } from "@trackfi/ui/components/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@trackfi/ui/components/popover"
import { useIsMobile } from "@trackfi/ui/hooks/use-mobile"

import {
  currentMonthDateOnlyRange,
  formatDateOnlyRange,
  isDateOnlyRange,
  parseLocalDateOnly,
} from "../lib/date"
import { dateFnsLocale, m } from "../lib/i18n"

type DateRange = { from: Date | undefined; to?: Date | undefined }

export function DashboardDateRangePicker({
  from,
  to,
  onChange,
}: {
  from: string
  to: string
  onChange(range: { from: string; to: string }): void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange>(() => selectedRange(from, to))
  const isMobile = useIsMobile()
  const draftFrom = draft.from ? format(draft.from, "yyyy-MM-dd") : ""
  const draftTo = draft.to ? format(draft.to, "yyyy-MM-dd") : ""
  const valid = isDateOnlyRange(draftFrom, draftTo, 365)

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) setDraft(selectedRange(from, to))
  }

  function apply() {
    if (!valid) return
    onChange({ from: draftFrom, to: draftTo })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2 px-3 text-[13px]"
            aria-label={m.dashboard_range_label()}
          />
        }
      >
        <CalendarDaysIcon />
        <span>{rangeLabel(from, to)}</span>
        <ChevronDownIcon className="text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-auto max-w-[calc(100vw-2rem)] gap-0 overflow-auto p-0"
      >
        <Calendar
          mode="range"
          locale={dateFnsLocale()}
          numberOfMonths={isMobile ? 1 : 2}
          selected={draft}
          {...(draft.from ? { defaultMonth: draft.from } : {})}
          onSelect={(range) => setDraft(range ?? { from: undefined })}
          autoFocus
        />
        <div className="flex items-center justify-between gap-3 border-t px-3 py-2.5">
          <p
            className={
              draft.from && draft.to && !valid
                ? "text-xs text-destructive"
                : "text-xs text-muted-foreground"
            }
          >
            {draft.from && draft.to && !valid
              ? m.dashboard_range_too_long()
              : m.dashboard_range_limit()}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              {m.common_cancel()}
            </Button>
            <Button type="button" disabled={!valid} onClick={apply}>
              {m.dashboard_range_apply()}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function selectedRange(from: string, to: string): DateRange {
  return { from: parseLocalDateOnly(from), to: parseLocalDateOnly(to) }
}

function rangeLabel(from: string, to: string) {
  const current = currentMonthDateOnlyRange()
  if (from === current.from && to === current.to)
    return m.dashboard_this_month()
  return formatDateOnlyRange(from, to)
}
