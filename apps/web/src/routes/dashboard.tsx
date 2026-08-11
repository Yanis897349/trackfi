import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { DashboardShell } from "../components/dashboard-shell"
import { getSession } from "../lib/api"

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: "/login" })
    return { currentUser: session.user }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  const { currentUser } = Route.useRouteContext()
  return (
    <DashboardShell user={currentUser}>
      <Outlet />
    </DashboardShell>
  )
}
