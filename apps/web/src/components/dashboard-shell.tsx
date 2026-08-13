import type { ReactNode } from "react"
import { useLocation, useNavigate } from "@tanstack/react-router"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@trackfi/ui/components/sidebar"

import { authClient, type CurrentUser } from "../lib/api"
import { m } from "../lib/i18n"
import { NotificationInbox } from "./notification-inbox"
import { TrackfiSidebar } from "./trackfi-sidebar"

function titleForPath(pathname: string) {
  const titles: Record<string, string> = {
    "/dashboard": m.nav_dashboard(),
    "/dashboard/waitlist": m.nav_waitlist(),
    "/dashboard/feature-flags": m.nav_feature_flags(),
    "/dashboard/settings": m.nav_settings(),
    "/dashboard/subscriptions": m.nav_subscriptions(),
    "/dashboard/expenses": m.nav_expenses(),
    "/dashboard/revenue": m.nav_revenue(),
    "/dashboard/notifications": m.notifications(),
    "/dashboard/subscriptions/calendar": m.nav_renewal_calendar(),
  }
  return titles[pathname] ?? m.nav_dashboard()
}

export function DashboardShell({
  children,
  user,
}: {
  children: ReactNode
  user: CurrentUser
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const title = titleForPath(location.pathname)

  async function signOut() {
    await authClient.signOut()
    await navigate({ to: "/login" })
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "18.25rem",
        "--sidebar-width-mobile": "18.25rem",
      }}
    >
      <TrackfiSidebar user={user} onSignOut={signOut} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-px bg-border" />
          <h1 className="text-sm font-medium">{title}</h1>
          <div className="ml-auto">
            <NotificationInbox />
          </div>
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
