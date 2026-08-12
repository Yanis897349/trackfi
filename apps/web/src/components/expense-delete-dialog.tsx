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

import type { Expense } from "../lib/expenses"

export function ExpenseDeleteDialog({
  expense,
  onOpenChange,
  onConfirm,
}: {
  expense: Expense | null
  onOpenChange(open: boolean): void
  onConfirm(): void
}) {
  return (
    <AlertDialog open={Boolean(expense)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {expense?.merchant}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the transaction and its receipt. This
            action cannot be undone.
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
