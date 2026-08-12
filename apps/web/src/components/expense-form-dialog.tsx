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
import { m } from "../lib/i18n"
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
            {expense ? m.expenses_edit() : m.expenses_add()}
          </DialogTitle>
          <DialogDescription>{m.expenses_form_description()}</DialogDescription>
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
            {m.common_cancel()}
          </Button>
          <Button type="submit" form={expenseFormId} disabled={pending}>
            {!expense && <PlusIcon />}
            {pending
              ? m.common_saving()
              : expense
                ? m.subscriptions_save_changes()
                : m.expenses_add()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
