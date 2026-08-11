import { Button } from "@trackfi/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@trackfi/ui/components/sheet"

import type { Subscription, SubscriptionInput } from "../lib/subscriptions"
import { SubscriptionForm, subscriptionFormId } from "./subscription-form"

export function SubscriptionFormSheet({
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
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>
            {subscription ? "Edit subscription" : "Add subscription"}
          </SheetTitle>
          <SheetDescription>
            Track the recurring amount and the next expected billing date.
          </SheetDescription>
        </SheetHeader>
        <SubscriptionForm
          currency={currency}
          subscription={subscription}
          error={error}
          onSubmit={onSubmit}
        />
        <SheetFooter className="border-t sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form={subscriptionFormId} disabled={pending}>
            {pending
              ? "Saving…"
              : subscription
                ? "Save changes"
                : "Add subscription"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
