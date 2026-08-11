import { Link } from "@tanstack/react-router"
import { CreditCardIcon, PlusIcon, SettingsIcon } from "lucide-react"

import { Button, buttonVariants } from "@trackfi/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@trackfi/ui/components/empty"

import { ModuleHeader } from "./module-layout"

export function CurrencyRequiredState({
  title = "Subscriptions",
  description = "Track recurring services, costs, and renewal dates.",
}: {
  title?: string
  description?: string
} = {}) {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <ModuleHeader title={title} description={description} />
      <Empty className="min-h-80 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SettingsIcon />
          </EmptyMedia>
          <EmptyTitle>Choose an account currency first</EmptyTitle>
          <EmptyDescription>
            Your subscriptions will share one currency so totals stay accurate
            and easy to understand.
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

export function SubscriptionEmptyState({
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
          <CreditCardIcon />
        </EmptyMedia>
        <EmptyTitle>
          {filtered
            ? "No matching subscriptions"
            : "Add your first subscription"}
        </EmptyTitle>
        <EmptyDescription>
          {filtered
            ? "Try changing your search or filters."
            : "Track a recurring service to see totals and renewal insights."}
        </EmptyDescription>
      </EmptyHeader>
      {!filtered && (
        <EmptyContent>
          <Button onClick={onAdd}>
            <PlusIcon /> Add subscription
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}
