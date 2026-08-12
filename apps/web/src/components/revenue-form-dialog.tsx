import { Button } from "@trackfi/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@trackfi/ui/components/dialog"

import type { RevenueSource, RevenueSourceInput } from "../lib/revenue"
import { RevenueForm, revenueFormId } from "./revenue-form"

export function RevenueFormDialog({
  currency,
  source,
  open,
  pending,
  error,
  onOpenChange,
  onOpenChangeComplete,
  onSubmit,
}: {
  currency: string
  source: RevenueSource | null
  open: boolean
  pending: boolean
  error: string
  onOpenChange(open: boolean): void
  onOpenChangeComplete(open: boolean): void
  onSubmit(input: RevenueSourceInput): void
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
            {source ? "Edit revenue source" : "Add revenue source"}
          </DialogTitle>
          <DialogDescription>
            {source
              ? "Update the net income you expect to receive and how certain it is."
              : "Add the net income you expect to receive and how certain it is."}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto">
          {open && (
            <RevenueForm
              key={source?.id ?? "new"}
              currency={currency}
              source={source}
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
              form={revenueFormId}
              disabled={pending}
            >
              {pending
                ? "Saving…"
                : source
                  ? "Save changes"
                  : "Add revenue source"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
