import { useState } from "react"
import { format, parseISO } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import { Calendar } from "@trackfi/ui/components/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@trackfi/ui/components/popover"
import { cn } from "@trackfi/ui/lib/utils"

export function DateOnlyPicker({
  id,
  className,
  value,
  placeholder = "Pick a date",
  onChange,
}: {
  id: string
  className?: string
  value: string
  placeholder?: string
  onChange(value: string): void
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseISO(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "h-10 w-full justify-start px-3 text-left font-normal",
              !selected && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <span className="flex-1">
          {selected ? format(selected, "PPP") : placeholder}
        </span>
        <CalendarIcon className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          {...(selected ? { selected, defaultMonth: selected } : {})}
          onSelect={(date) => {
            if (!date) return
            onChange(format(date, "yyyy-MM-dd"))
            setOpen(false)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
