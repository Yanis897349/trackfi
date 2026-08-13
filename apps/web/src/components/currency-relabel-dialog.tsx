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

import { m } from "../lib/i18n"

export function CurrencyRelabelDialog({
  currency,
  onConfirm,
  onOpenChange,
  open,
}: {
  currency: string
  onConfirm(): void
  onOpenChange(open: boolean): void
  open: boolean
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {m.settings_change_currency_title()}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {m.settings_change_currency_description({ currency })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{m.common_cancel()}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {m.settings_change_currency()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
