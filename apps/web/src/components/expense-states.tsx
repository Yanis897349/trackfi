import { Link } from "@tanstack/react-router"
import { PlusIcon, ReceiptTextIcon, SettingsIcon } from "lucide-react"

import { Button, buttonVariants } from "@trackfi/ui/components/button"
import { Card, CardContent, CardHeader } from "@trackfi/ui/components/card"
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

export function ExpenseCurrencyRequiredState() {
  return (
    <section className="mx-auto w-full max-w-[1120px] space-y-6">
      <ModuleHeader
        title="Expenses"
        description="Plan outgoing costs and understand what’s coming next."
      />
      <Empty className="min-h-80 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SettingsIcon />
          </EmptyMedia>
          <EmptyTitle>Choose an account currency first</EmptyTitle>
          <EmptyDescription>
            Expenses and subscriptions share one currency so forecasts stay
            consistent.
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

export function ExpenseEmptyState({
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
          <ReceiptTextIcon />
        </EmptyMedia>
        <EmptyTitle>
          {filtered ? "No matching expenses" : "Add your first expense"}
        </EmptyTitle>
        <EmptyDescription>
          {filtered
            ? "Try changing your search or filters."
            : "Add planned spending to forecast recurring, one-time, and flexible costs."}
        </EmptyDescription>
      </EmptyHeader>
      {!filtered && (
        <EmptyContent>
          <Button onClick={onAdd}>
            <PlusIcon /> Add expense
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}

export function ExpenseLoadingState() {
  return (
    <section
      className="mx-auto w-full max-w-[1120px] space-y-6"
      role="status"
      aria-label="Loading expenses"
      aria-busy="true"
    >
      <ModuleHeader
        title="Expenses"
        description="Plan outgoing costs and understand what’s coming next."
        action={<Skeleton className="h-9 w-36" />}
      />
      <section className="space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <OutlookCardSkeleton />
          <OutlookCardSkeleton />
        </div>
        <Card className="gap-0 py-0">
          <CardHeader className="h-16 px-4 py-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </CardHeader>
          <CardContent className="grid gap-2 border-t p-4 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-[72px]" />
            ))}
          </CardContent>
        </Card>
      </section>
      <section className="space-y-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-72" />
      </section>
    </section>
  )
}

function OutlookCardSkeleton() {
  return (
    <Card className="h-[230px] gap-3 py-4">
      <CardHeader className="space-y-2 px-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-44" />
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-[118px] w-full" />
      </CardContent>
    </Card>
  )
}
