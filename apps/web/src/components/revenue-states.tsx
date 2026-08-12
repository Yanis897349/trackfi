import { Link } from "@tanstack/react-router"
import { BanknoteIcon, PlusIcon, SettingsIcon } from "lucide-react"

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

export function RevenueCurrencyRequiredState() {
  return (
    <section className="mx-auto w-full max-w-[1120px] space-y-6">
      <ModuleHeader
        title="Revenue"
        description="Know what’s coming in, when it lands, and how reliable it is."
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
        description="Know what’s coming in, when it lands, and how reliable it is."
        action={<Skeleton className="h-9 w-44" />}
      />
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <OutlookCardSkeleton />
          <OutlookCardSkeleton />
        </div>
        <Card className="gap-0 py-0">
          <CardHeader className="h-12 px-4 py-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </CardHeader>
          <CardContent className="grid gap-2 border-t p-4 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-12" />
            ))}
          </CardContent>
        </Card>
      </section>
      <section className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-80 max-w-full" />
        </div>
        <div className="flex flex-col gap-3 lg:flex-row">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full lg:w-[470px]" />
        </div>
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
