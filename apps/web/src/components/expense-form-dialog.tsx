import { PlusIcon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@trackfi/ui/components/dialog"

import type { Expense, ExpenseInput } from "../lib/expenses"
import { ExpenseForm, expenseFormId } from "./expense-form"

export function ExpenseFormDialog({
  currency,
  expense,
  open,
  pending,
  error,
  onOpenChange,
  onOpenChangeComplete,
  onSubmit,
}: {
  currency: string
  expense: Expense | null
  open: boolean
  pending: boolean
  error: string
  onOpenChange(open: boolean): void
  onOpenChangeComplete(open: boolean): void
  onSubmit(input: ExpenseInput, receipt: File | null): void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <DialogContent className="rounded-[14px] bg-[#fcfcfb] sm:max-w-[744px] [&>[data-slot=dialog-close]]:top-5 [&>[data-slot=dialog-close]]:right-5">
        <DialogHeader className="gap-1 border-b px-7 py-5">
          <DialogTitle className="text-lg font-semibold">
            {expense ? "Edit expense" : "Add expense"}
          </DialogTitle>
          <DialogDescription>
            Record a purchase and keep your spend controls up to date.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto">
          {open && (
            <ExpenseForm
              key={expense?.id ?? "new"}
              currency={currency}
              expense={expense}
              error={error}
              onSubmit={onSubmit}
            />
          )}
        </div>
        <DialogFooter className="gap-2 px-7 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form={expenseFormId} disabled={pending}>
            {!expense && <PlusIcon />}
            {pending ? "Saving…" : expense ? "Save changes" : "Add expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
