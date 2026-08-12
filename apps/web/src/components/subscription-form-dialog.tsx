import { Button } from "@trackfi/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@trackfi/ui/components/dialog"

import type { Subscription, SubscriptionInput } from "../lib/subscriptions"
import { m } from "../lib/i18n"
import { SubscriptionForm, subscriptionFormId } from "./subscription-form"

export function SubscriptionFormDialog({
  currency,
  subscription,
  open,
  pending,
  error,
  onOpenChange,
  onOpenChangeComplete,
  onSubmit,
}: {
  currency: string
  subscription: Subscription | null
  open: boolean
  pending: boolean
  error: string
  onOpenChange(open: boolean): void
  onOpenChangeComplete(open: boolean): void
  onSubmit(input: SubscriptionInput): void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader className="gap-2 border-b-0 p-6">
          <DialogTitle className="text-lg leading-7 font-semibold">
            {subscription ? m.subscriptions_edit() : m.subscriptions_add()}
          </DialogTitle>
          <DialogDescription>
            {m.subscriptions_form_description()}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto">
          <SubscriptionForm
            currency={currency}
            subscription={subscription}
            error={error}
            onSubmit={onSubmit}
          />
        </div>
        <DialogFooter className="bg-transparent sm:h-[72px]">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="px-4"
            onClick={() => onOpenChange(false)}
          >
            {m.common_cancel()}
          </Button>
          <Button
            type="submit"
            size="lg"
            className="px-4"
            form={subscriptionFormId}
            disabled={pending}
          >
            {pending
              ? m.common_saving()
              : subscription
                ? m.subscriptions_save_changes()
                : m.subscriptions_add()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
