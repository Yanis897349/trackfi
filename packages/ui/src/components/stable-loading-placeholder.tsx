import { cn } from "@trackfi/ui/lib/utils"

function StableLoadingPlaceholder({
  isVisible,
  className,
  ...props
}: React.ComponentProps<"div"> & { isVisible: boolean }) {
  return (
    <div
      {...props}
      aria-hidden={isVisible ? undefined : true}
      className={cn(!isVisible && "invisible", className)}
    />
  )
}

export { StableLoadingPlaceholder }
