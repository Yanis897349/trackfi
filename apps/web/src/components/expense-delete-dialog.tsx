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
          <AlertDialogTitle>Delete {expense?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the expense. This action cannot be undone.
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
