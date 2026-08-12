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
  onSubmit(input: ExpenseInput): void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <DialogContent className="rounded-xl sm:max-w-[700px] [&>[data-slot=dialog-close]]:top-6 [&>[data-slot=dialog-close]]:right-6">
        <DialogHeader className="gap-1.5 border-b-0 px-7 pt-[26px] pb-5">
          <DialogTitle className="text-2xl leading-8 font-bold tracking-tight">
            {expense ? "Edit expense" : "Add expense"}
          </DialogTitle>
          <DialogDescription>
            Add planned spending to your forecast. Subscriptions are included
            automatically.
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
        <DialogFooter className="gap-3 px-7 sm:h-[72px]">
          <div className="flex w-full gap-2.5 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1 px-4 sm:flex-none"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              className="flex-1 px-4 sm:flex-none"
              form={expenseFormId}
              disabled={pending}
            >
              {pending ? "Saving…" : expense ? "Save changes" : "Add expense"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
