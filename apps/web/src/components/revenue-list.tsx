import type { RevenueSource } from "../lib/revenue"
import type { RevenueListActions } from "./revenue-actions"
import { RevenueListDesktop } from "./revenue-list-desktop"
import { RevenueListMobile } from "./revenue-list-mobile"

export function RevenueList({
  sources,
  currency,
  page,
  total,
  onPageChange,
  ...actions
}: {
  sources: RevenueSource[]
  currency: string
  page: number
  total: number
  onPageChange(page: number): void
} & RevenueListActions) {
  const shown = Math.min(page * 3, total)
  const pagination = {
    shown,
    total,
    hasPrevious: page > 1,
    hasNext: shown < total,
    onPrevious: () => onPageChange(page - 1),
    onNext: () => onPageChange(page + 1),
  }
  return (
    <>
      <RevenueListDesktop
        sources={sources}
        currency={currency}
        {...pagination}
        {...actions}
      />
      <RevenueListMobile
        sources={sources}
        currency={currency}
        {...pagination}
        {...actions}
      />
    </>
  )
}
