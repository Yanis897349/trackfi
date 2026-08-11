"use client"

import * as React from "react"
import { PreviewCard as HoverCardPrimitive } from "@base-ui/react/preview-card"
import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react"

import { useControlledOpen } from "@trackfi/ui/hooks/use-controlled-open"
import { spring } from "@trackfi/ui/lib/springs"
import { cn } from "@trackfi/ui/lib/utils"

const HoverCardOpenContext = React.createContext(false)

function HoverCard({
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  ...props
}: HoverCardPrimitive.Root.Props) {
  const [open, handleOpenChange] = useControlledOpen({
    open: controlledOpen,
    defaultOpen,
    onOpenChange,
  })
  return (
    <HoverCardOpenContext.Provider value={open}>
      <HoverCardPrimitive.Root
        data-slot="hover-card"
        open={open}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </HoverCardOpenContext.Provider>
  )
}

function HoverCardTrigger(props: HoverCardPrimitive.Trigger.Props) {
  return (
    <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  )
}

function HoverCardPortal(props: HoverCardPrimitive.Portal.Props) {
  const open = React.useContext(HoverCardOpenContext)
  return (
    <AnimatePresence>
      {open && <HoverCardPrimitive.Portal {...props} keepMounted />}
    </AnimatePresence>
  )
}

function HoverCardContent({
  className,
  side = "bottom",
  sideOffset = 8,
  align = "center",
  alignOffset = 0,
  ...props
}: HoverCardPrimitive.Popup.Props &
  Pick<
    HoverCardPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <HoverCardPortal>
      <HoverCardPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <HoverCardPrimitive.Popup
          data-slot="hover-card-content"
          className={cn(
            "w-72 origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-hidden",
            className
          )}
          render={(renderProps, state) => (
            <motion.div
              {...(renderProps as unknown as HTMLMotionProps<"div">)}
              initial={{
                opacity: 0,
                scale: 0.97,
                y: state.side === "top" ? 4 : -4,
              }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{
                opacity: 0,
                scale: 0.97,
                y: state.side === "top" ? 4 : -4,
                transition: spring.fast.exit,
              }}
              transition={spring.fast}
            />
          )}
          {...props}
        />
      </HoverCardPrimitive.Positioner>
    </HoverCardPortal>
  )
}

export { HoverCard, HoverCardContent, HoverCardTrigger }
