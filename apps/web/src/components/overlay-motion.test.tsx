import { useState } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MotionConfig } from "motion/react"
import { describe, expect, it, vi } from "vitest"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@trackfi/ui/components/alert-dialog"
import { Button } from "@trackfi/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@trackfi/ui/components/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@trackfi/ui/components/select"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@trackfi/ui/components/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@trackfi/ui/components/tooltip"

describe("shared overlay motion", () => {
  it("opens and closes sheets and alert dialogs", async () => {
    render(
      <MotionConfig reducedMotion="user">
        <Sheet>
          <SheetTrigger render={<Button />}>Open sheet</SheetTrigger>
          <SheetContent>
            <SheetTitle>Animated sheet</SheetTitle>
          </SheetContent>
        </Sheet>
        <AlertDialog>
          <AlertDialogTrigger render={<Button />}>
            Open alert
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Animated alert</AlertDialogTitle>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      </MotionConfig>
    )

    fireEvent.click(screen.getByRole("button", { name: "Open sheet" }))
    expect(
      await screen.findByRole("dialog", { name: "Animated sheet" })
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Animated sheet" })
      ).not.toBeInTheDocument()
    )

    fireEvent.click(screen.getByRole("button", { name: "Open alert" }))
    expect(
      await screen.findByRole("alertdialog", { name: "Animated alert" })
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    await waitFor(() =>
      expect(
        screen.queryByRole("alertdialog", { name: "Animated alert" })
      ).not.toBeInTheDocument()
    )
  })

  it("keeps select labels and menu actions functional", async () => {
    const onAction = vi.fn()
    const onSelectAnimationStart = vi.fn()
    render(
      <MotionConfig reducedMotion="user">
        <Select
          defaultValue="monthly"
          items={[
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly" },
          ]}
        >
          <SelectTrigger aria-label="Cadence">
            <SelectValue />
          </SelectTrigger>
          <SelectContent onAnimationStart={onSelectAnimationStart}>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button />}>
            Open menu
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onAction}>Edit</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </MotionConfig>
    )

    const cadence = screen.getByLabelText("Cadence")
    expect(cadence).toHaveTextContent("Monthly")
    fireEvent.click(cadence)
    const yearly = await screen.findByRole("option", { name: "Yearly" })
    fireEvent.pointerDown(yearly, { pointerType: "mouse" })
    fireEvent.click(yearly)
    expect(cadence).toHaveTextContent("Yearly")
    await waitFor(() =>
      expect(
        screen.queryByRole("option", { name: "Yearly" })
      ).not.toBeInTheDocument()
    )

    onSelectAnimationStart.mockClear()
    fireEvent.click(cadence)
    await screen.findByRole("option", { name: "Monthly" })
    await waitFor(() => expect(onSelectAnimationStart).toHaveBeenCalled())
    fireEvent.click(cadence)

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    fireEvent.click(await screen.findByRole("menuitem", { name: "Edit" }))
    expect(onAction).toHaveBeenCalledOnce()
  })

  it("supports controlled tooltip presence", async () => {
    render(
      <MotionConfig reducedMotion="user">
        <TooltipHarness />
      </MotionConfig>
    )

    fireEvent.click(screen.getByRole("button", { name: "Show tooltip" }))
    expect(screen.getByText("Helpful text")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Hide tooltip" }))
    await waitFor(() =>
      expect(screen.queryByText("Helpful text")).not.toBeInTheDocument()
    )
  })
})

function TooltipHarness() {
  const [open, setOpen] = useState(false)

  return (
    <TooltipProvider>
      <Button onClick={() => setOpen((current) => !current)}>
        {open ? "Hide tooltip" : "Show tooltip"}
      </Button>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger render={<Button />}>Target</TooltipTrigger>
        <TooltipContent>Helpful text</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
