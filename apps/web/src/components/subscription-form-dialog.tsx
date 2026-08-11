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
            {subscription ? "Edit subscription" : "Add subscription"}
          </DialogTitle>
          <DialogDescription>
            Track a recurring service, its cost, and the next expected billing
            date.
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
        <DialogFooter className="h-[72px] bg-transparent">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="px-4"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            className="px-4"
            form={subscriptionFormId}
            disabled={pending}
          >
            {pending
              ? "Saving…"
              : subscription
                ? "Save changes"
                : "Add subscription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
