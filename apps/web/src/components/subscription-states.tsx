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
import { m } from "../lib/i18n"

export function CurrencyRequiredState({
  title = m.nav_subscriptions(),
  description = m.module_subscriptions_description(),
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
          <EmptyTitle>{m.subscriptions_choose_currency_title()}</EmptyTitle>
          <EmptyDescription>
            {m.subscriptions_choose_currency_description()}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link to="/dashboard/settings" className={buttonVariants()}>
            {m.subscriptions_open_settings()}
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
            ? m.subscriptions_no_match_title()
            : m.subscriptions_empty_title()}
        </EmptyTitle>
        <EmptyDescription>
          {filtered
            ? m.subscriptions_no_match_description()
            : m.subscriptions_empty_description()}
        </EmptyDescription>
      </EmptyHeader>
      {!filtered && (
        <EmptyContent>
          <Button onClick={onAdd}>
            <PlusIcon /> {m.subscriptions_add()}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}
