import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"

import { m } from "../lib/i18n"

export function NotificationHistoryPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange(page: number): void
}) {
  const firstPage = Math.max(1, Math.min(page - 1, totalPages - 2))
  const pages = Array.from(
    { length: Math.min(3, totalPages) },
    (_, index) => firstPage + index
  )

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="size-[30px]"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeftIcon />
        <span className="sr-only">{m.pagination_previous()}</span>
      </Button>
      {pages.map((pageNumber) => (
        <Button
          key={pageNumber}
          type="button"
          variant={pageNumber === page ? "default" : "outline"}
          size="icon-sm"
          className="size-[30px] text-[11px]"
          aria-current={pageNumber === page ? "page" : undefined}
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber}
        </Button>
      ))}
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="size-[30px]"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRightIcon />
        <span className="sr-only">{m.pagination_next()}</span>
      </Button>
    </div>
  )
}
