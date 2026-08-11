import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react"

import { cn } from "@trackfi/ui/lib/utils"
import { useControlledOpen } from "@trackfi/ui/hooks/use-controlled-open"
import { spring } from "@trackfi/ui/lib/springs"

const TooltipOpenContext = React.createContext(false)

function TooltipProvider({
  delay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  )
}

function Tooltip<Payload>({
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  ...props
}: TooltipPrimitive.Root.Props<Payload>) {
  const [open, handleOpenChange] = useControlledOpen({
    open: controlledOpen,
    defaultOpen,
    onOpenChange,
  })

  return (
    <TooltipOpenContext.Provider value={open}>
      <TooltipPrimitive.Root
        data-slot="tooltip"
        open={open}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </TooltipOpenContext.Provider>
  )
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipPortal({ ...props }: TooltipPrimitive.Portal.Props) {
  const open = React.useContext(TooltipOpenContext)

  return (
    <AnimatePresence>
      {open && <TooltipPrimitive.Portal {...props} keepMounted />}
    </AnimatePresence>
  )
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <TooltipPortal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm",
            className
          )}
          render={(renderProps, state) => (
            <motion.div
              {...(renderProps as unknown as HTMLMotionProps<"div">)}
              initial={tooltipHiddenState(state.side)}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{
                ...tooltipHiddenState(state.side),
                transition: spring.fast.exit,
              }}
              transition={state.instant ? { duration: 0 } : spring.fast}
            />
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPortal>
  )
}

function tooltipHiddenState(
  side: "top" | "right" | "bottom" | "left" | "inline-start" | "inline-end"
) {
  if (side === "top") return { opacity: 0, scale: 0.96, x: 0, y: 4 }
  if (side === "bottom") return { opacity: 0, scale: 0.96, x: 0, y: -4 }
  if (side === "left" || side === "inline-start") {
    return { opacity: 0, scale: 0.96, x: 4, y: 0 }
  }
  return { opacity: 0, scale: 0.96, x: -4, y: 0 }
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
