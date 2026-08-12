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

import type { Subscription } from "../lib/subscriptions"
import { m } from "../lib/i18n"

export function SubscriptionDeleteDialog({
  subscription,
  onOpenChange,
  onConfirm,
}: {
  subscription: Subscription | null
  onOpenChange(open: boolean): void
  onConfirm(): void
}) {
  return (
    <AlertDialog open={Boolean(subscription)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{m.subscriptions_delete_title()}</AlertDialogTitle>
          <AlertDialogDescription>
            {m.subscriptions_delete_description({
              name: subscription?.name ?? "",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{m.common_cancel()}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {m.subscriptions_delete()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
