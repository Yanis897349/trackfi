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
import { m } from "../lib/i18n"

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
          <AlertDialogTitle>{m.expenses_delete_title()}</AlertDialogTitle>
          <AlertDialogDescription>
            {m.expenses_delete_description({
              merchant: expense?.merchant ?? "",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{m.common_cancel()}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {m.expenses_delete()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
