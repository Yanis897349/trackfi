import { createFileRoute } from "@tanstack/react-router"

import { modules } from "../modules"
import { m } from "../lib/i18n"

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
})

function DashboardHome() {
  const { currentUser } = Route.useRouteContext()
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {m.dashboard_welcome({ name: currentUser.name })}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          {m.dashboard_overview()}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {m.dashboard_description()}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {modules.map(({ id, DashboardCard }) => (
          <DashboardCard key={id} />
        ))}
      </div>
    </section>
  )
}
