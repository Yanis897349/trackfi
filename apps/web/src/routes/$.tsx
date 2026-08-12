import { createFileRoute, Link } from "@tanstack/react-router"

import { buttonVariants } from "@trackfi/ui/components/button"
import { cn } from "@trackfi/ui/lib/utils"

import { m } from "../lib/i18n"

export const Route = createFileRoute("/$")({
  component: CatchAllRoute,
})

function CatchAllRoute() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold">Trackfi</p>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">
          {m.not_found_title()}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {m.not_found_description()}
        </p>
        <Link to="/" className={cn(buttonVariants(), "mt-7")}>
          {m.not_found_action()}
        </Link>
      </div>
    </main>
  )
}
