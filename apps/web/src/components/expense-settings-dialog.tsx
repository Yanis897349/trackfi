import { Button } from "@trackfi/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@trackfi/ui/components/dialog"

import type { ExpenseSettings } from "../lib/expenses"
import {
  ExpenseSettingsForm,
  expenseSettingsFormId,
} from "./expense-settings-form"

export function ExpenseSettingsDialog({
  currency,
  settings,
  open,
  pending,
  error,
  onOpenChange,
  onSave,
}: {
  currency: string
  settings: ExpenseSettings
  open: boolean
  pending: boolean
  error: string
  onOpenChange(open: boolean): void
  onSave(settings: ExpenseSettings): void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[14px] sm:max-w-[704px] [&>[data-slot=dialog-close]]:top-5 [&>[data-slot=dialog-close]]:right-5">
        <DialogHeader className="gap-1 border-b-0 px-7 pt-6 pb-5">
          <DialogTitle className="text-lg font-semibold">
            Expense settings
          </DialogTitle>
          <DialogDescription>
            Set the guardrails Trackfi uses to plan and monitor your spending.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto px-7 pb-5">
          {open && (
            <ExpenseSettingsForm
              key={settings.updatedAt ?? "defaults"}
              currency={currency}
              settings={settings}
              error={error}
              onSave={onSave}
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
          <Button type="submit" form={expenseSettingsFormId} disabled={pending}>
            {pending ? "Saving…" : "Save settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
