import * as React from "react"

export function useControlledOpen<EventDetails>({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}: {
  open?: boolean | undefined
  defaultOpen?: boolean | undefined
  onOpenChange?:
    ((open: boolean, eventDetails: EventDetails) => void) | undefined
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = controlledOpen ?? uncontrolledOpen

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean, eventDetails: EventDetails) => {
      if (controlledOpen === undefined) setUncontrolledOpen(nextOpen)
      onOpenChange?.(nextOpen, eventDetails)
    },
    [controlledOpen, onOpenChange]
  )

  return [open, handleOpenChange] as const
}
