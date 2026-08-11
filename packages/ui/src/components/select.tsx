"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react"

import { cn } from "@trackfi/ui/lib/utils"
import { useControlledOpen } from "@trackfi/ui/hooks/use-controlled-open"
import { spring } from "@trackfi/ui/lib/springs"

const SelectOpenContext = React.createContext(false)

function Select<Value, Multiple extends boolean | undefined = false>({
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  ...props
}: SelectPrimitive.Root.Props<Value, Multiple>) {
  const [open, handleOpenChange] = useControlledOpen({
    open: controlledOpen,
    defaultOpen,
    onOpenChange,
  })

  return (
    <SelectOpenContext.Provider value={open}>
      <SelectPrimitive.Root
        open={open}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </SelectOpenContext.Provider>
  )
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      {...props}
    />
  )
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & { size?: "sm" | "default" }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 *:data-[slot=select-value]:line-clamp-1 dark:bg-input/30",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  const open = React.useContext(SelectOpenContext)

  return (
    <AnimatePresence>
      {open && (
        <SelectPrimitive.Portal>
          <SelectPrimitive.Positioner
            side={side}
            sideOffset={sideOffset}
            align={align}
            alignOffset={alignOffset}
            alignItemWithTrigger={alignItemWithTrigger}
            className="isolate z-50"
          >
            <SelectPrimitive.Popup
              data-slot="select-content"
              className={cn(
                "relative z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10",
                className
              )}
              render={(renderProps, state) => (
                <motion.div
                  {...(renderProps as unknown as HTMLMotionProps<"div">)}
                  initial={selectHiddenState(state.side)}
                  animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                  exit={{
                    ...selectHiddenState(state.side),
                    transition: spring.fast.exit,
                  }}
                  transition={spring.fast}
                />
              )}
              {...props}
            >
              <SelectScrollUpButton />
              <SelectPrimitive.List>{children}</SelectPrimitive.List>
              <SelectScrollDownButton />
            </SelectPrimitive.Popup>
          </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
      )}
    </AnimatePresence>
  )
}

function selectHiddenState(
  side:
    "none" | "top" | "right" | "bottom" | "left" | "inline-start" | "inline-end"
) {
  if (side === "top") return { opacity: 0, scale: 0.96, x: 0, y: 4 }
  if (side === "bottom") return { opacity: 0, scale: 0.96, x: 0, y: -4 }
  if (side === "left" || side === "inline-start") {
    return { opacity: 0, scale: 0.96, x: 4, y: 0 }
  }
  if (side === "right" || side === "inline-end") {
    return { opacity: 0, scale: 0.96, x: -4, y: 0 }
  }
  return { opacity: 0, scale: 0.96, x: 0, y: 0 }
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center">
        <CheckIcon className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectScrollUpButton(
  props: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>
) {
  return (
    <SelectPrimitive.ScrollUpArrow
      className="flex w-full items-center justify-center bg-popover py-1"
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton(
  props: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>
) {
  return (
    <SelectPrimitive.ScrollDownArrow
      className="flex w-full items-center justify-center bg-popover py-1"
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
}
