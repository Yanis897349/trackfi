import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@trackfi/ui/components/alert-dialog"

import type { RevenueSource } from "../lib/revenue"

export function RevenueDeleteDialog({
  source,
  onOpenChange,
  onConfirm,
}: {
  source: RevenueSource | null
  onOpenChange(open: boolean): void
  onConfirm(): void
}) {
  return (
    <AlertDialog open={Boolean(source)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {source?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the revenue source. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
