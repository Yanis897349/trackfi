import { cn } from "@trackfi/ui/lib/utils"

export function TrackfiBrand({
  className,
  compact = false,
  inverse = false,
  plainMark = false,
}: {
  className?: string
  compact?: boolean
  inverse?: boolean
  plainMark?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center",
        compact ? "gap-2" : "gap-2.5",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center font-mono font-semibold",
          compact
            ? plainMark
              ? "text-base"
              : "size-5 text-sm"
            : "size-7 text-xl",
          plainMark ? "text-[#2563eb]" : "rounded-md bg-[#2563eb] text-white"
        )}
      >
        +
      </span>
      <span
        className={cn(
          "font-semibold tracking-tight",
          compact ? "text-[15px]" : "text-lg",
          inverse ? "text-white" : "text-[#111318]"
        )}
      >
        Trackfi
      </span>
    </div>
  )
}
