import { useRef } from "react"
import { PaperclipIcon } from "lucide-react"

import { Field, FieldLabel } from "@trackfi/ui/components/field"

export function ExpenseReceiptField({
  receiptName,
  onSelect,
  onRemove,
}: {
  receiptName: string | null | undefined
  onSelect(file: File | null): void
  onRemove(): void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  return (
    <Field className="gap-1.5">
      <FieldLabel>Receipt</FieldLabel>
      <div
        className="flex min-h-[58px] items-center gap-3 rounded-lg border bg-muted/20 px-3.5"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          onSelect(event.dataTransfer.files[0] ?? null)
        }}
      >
        <span className="flex size-8 items-center justify-center rounded-md border bg-background">
          <PaperclipIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">
            {receiptName ?? "Attach receipt"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            PDF, JPG or PNG · up to 10 MB
          </p>
        </div>
        <input
          ref={fileInput}
          type="file"
          className="sr-only"
          accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
          onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
        />
        {receiptName ? (
          <button
            type="button"
            className="text-xs font-medium hover:underline"
            onClick={onRemove}
          >
            Remove
          </button>
        ) : (
          <button
            type="button"
            className="text-xs font-medium hover:underline"
            onClick={() => fileInput.current?.click()}
          >
            Browse
          </button>
        )}
      </div>
    </Field>
  )
}
