import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@trackfi/ui/lib/utils"

function Input({
  className,
  type,
  onKeyDown,
  ...props
}: React.ComponentProps<"input">) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event)

    if (
      type === "password" &&
      event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      (event.key.length === 1 || event.key === "Dead")
    ) {
      event.preventDefault()
    }
  }

  return (
    <InputPrimitive
      type={type}
      onKeyDown={handleKeyDown}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
