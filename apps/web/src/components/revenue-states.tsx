import { Link } from "@tanstack/react-router"
import { BanknoteIcon, PlusIcon, SettingsIcon } from "lucide-react"

import { Button, buttonVariants } from "@trackfi/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@trackfi/ui/components/empty"
import { Skeleton } from "@trackfi/ui/components/skeleton"

import { ModuleHeader } from "./module-layout"

export function RevenueCurrencyRequiredState() {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <ModuleHeader
        title="Revenue"
        description="Forecast take-home income across scheduled and variable sources."
      />
      <Empty className="min-h-80 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SettingsIcon />
          </EmptyMedia>
          <EmptyTitle>Choose an account currency first</EmptyTitle>
          <EmptyDescription>
            Revenue and subscription totals share one currency so your financial
            overview stays consistent.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link to="/dashboard/settings" className={buttonVariants()}>
            Open settings
          </Link>
        </EmptyContent>
      </Empty>
    </section>
  )
}

export function RevenueEmptyState({
  filtered,
  onAdd,
}: {
  filtered: boolean
  onAdd(): void
}) {
  return (
    <Empty className="min-h-64 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BanknoteIcon />
        </EmptyMedia>
        <EmptyTitle>
          {filtered
            ? "No matching revenue sources"
            : "Add your first revenue source"}
        </EmptyTitle>
        <EmptyDescription>
          {filtered
            ? "Try changing your search or filters."
            : "Add expected income to see monthly forecasts and source insights."}
        </EmptyDescription>
      </EmptyHeader>
      {!filtered && (
        <EmptyContent>
          <Button onClick={onAdd}>
            <PlusIcon /> Add revenue source
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}

export function RevenueLoadingState() {
  return (
    <section
      className="mx-auto w-full max-w-[1120px] space-y-6"
      role="status"
      aria-label="Loading revenue"
      aria-busy="true"
    >
      <ModuleHeader
        title="Revenue"
        description="Forecast take-home income across scheduled and variable sources."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[126px]" />
        ))}
      </div>
      <Skeleton className="h-56" />
      <Skeleton className="h-10" />
      <Skeleton className="h-64" />
    </section>
  )
}
