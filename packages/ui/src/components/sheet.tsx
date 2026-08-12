"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react"

import { cn } from "@trackfi/ui/lib/utils"
import { Button } from "@trackfi/ui/components/button"
import { useControlledOpen } from "@trackfi/ui/hooks/use-controlled-open"
import { spring } from "@trackfi/ui/lib/springs"
import { XIcon } from "lucide-react"
import { useUiText } from "@trackfi/ui/components/ui-text"

const SheetOpenContext = React.createContext(false)

function Sheet({
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  ...props
}: SheetPrimitive.Root.Props) {
  const [open, handleOpenChange] = useControlledOpen({
    open: controlledOpen,
    defaultOpen,
    onOpenChange,
  })

  return (
    <SheetOpenContext.Provider value={open}>
      <SheetPrimitive.Root
        data-slot="sheet"
        open={open}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </SheetOpenContext.Provider>
  )
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  const open = React.useContext(SheetOpenContext)

  return (
    <AnimatePresence>
      {open && (
        <SheetPrimitive.Portal
          data-slot="sheet-portal"
          {...props}
          keepMounted
        />
      )}
    </AnimatePresence>
  )
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs",
        className
      )}
      render={(renderProps) => (
        <motion.div
          {...(renderProps as unknown as HTMLMotionProps<"div">)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: spring.fast.exit }}
          transition={spring.fast}
        />
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  const text = useUiText()
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
          className
        )}
        render={(renderProps) => (
          <motion.div
            {...(renderProps as unknown as HTMLMotionProps<"div">)}
            initial={sheetHiddenState(side)}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{
              ...sheetHiddenState(side),
              transition: spring.slow.exit,
            }}
            transition={spring.slow}
          />
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 right-3"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">{text.close}</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function sheetHiddenState(side: "top" | "right" | "bottom" | "left") {
  if (side === "left") return { opacity: 0.9999, x: "-100%", y: 0 }
  if (side === "right") return { opacity: 0.9999, x: "100%", y: 0 }
  if (side === "top") return { opacity: 0.9999, x: 0, y: "-100%" }
  return { opacity: 0.9999, x: 0, y: "100%" }
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
