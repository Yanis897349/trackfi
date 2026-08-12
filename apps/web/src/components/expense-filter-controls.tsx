import type { LucideIcon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@trackfi/ui/components/select"
import { cn } from "@trackfi/ui/lib/utils"

export function ExpenseFilterSelect({
  icon: Icon,
  label,
  value,
  items,
  onChange,
  className,
}: {
  icon?: LucideIcon
  label: string
  value: string
  items: Array<{ value: string; label: string }>
  onChange(value: string): void
  className?: string
}) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => next && onChange(String(next))}
    >
      <SelectTrigger
        className={cn("h-10 w-full data-[size=default]:h-10", className)}
        aria-label={label}
      >
        {Icon && <Icon className="size-3.5 text-muted-foreground" />}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function ExpenseQuickFilter({
  pressed,
  onClick,
  icon: Icon,
  label,
}: {
  pressed: boolean
  onClick(): void
  icon: LucideIcon
  label: string
}) {
  return (
    <Button
      type="button"
      size="xs"
      variant="outline"
      aria-pressed={pressed}
      className={cn(
        "rounded-full",
        pressed && "border-orange-300 bg-orange-50 text-orange-800"
      )}
      onClick={onClick}
    >
      <Icon />
      {label}
    </Button>
  )
}
