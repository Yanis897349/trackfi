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
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader className="gap-2 border-b-0 p-6">
          <DialogTitle className="text-lg leading-7 font-semibold">
            {source ? "Edit revenue source" : "Add revenue source"}
          </DialogTitle>
          <DialogDescription>
            Track expected take-home income from a scheduled or variable source.
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
        <DialogFooter className="bg-transparent sm:h-[72px]">
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
            form={revenueFormId}
            disabled={pending}
          >
            {pending ? "Saving…" : source ? "Save changes" : "Add source"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
