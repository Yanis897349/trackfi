import type { ReactNode } from "react"
import { Link, useLocation, useNavigate } from "@tanstack/react-router"
import {
  FlagIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MailCheckIcon,
  SettingsIcon,
} from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@trackfi/ui/components/sidebar"

import { authClient, type CurrentUser } from "../lib/api"
import { modules } from "../modules"

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/waitlist": "Waitlist approvals",
  "/dashboard/feature-flags": "Feature flags",
  "/dashboard/settings": "Settings",
  "/dashboard/subscriptions": "Subscriptions",
  "/dashboard/revenue": "Revenue",
  "/dashboard/subscriptions/calendar": "Renewal calendar",
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
  const title = titles[location.pathname] ?? "Dashboard"

  async function signOut() {
    await authClient.signOut()
    await navigate({ to: "/login" })
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-14 justify-center border-b">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 overflow-hidden px-2 font-semibold group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs text-primary-foreground">
              T
            </span>
            <span className="group-data-[collapsible=icon]:hidden">
              Trackfi
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Dashboard"
                    isActive={location.pathname === "/dashboard"}
                    render={<Link to="/dashboard" />}
                  >
                    <LayoutDashboardIcon />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Modules</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {modules.map((module) => (
                  <SidebarMenuItem key={module.id}>
                    <SidebarMenuButton
                      tooltip={module.label}
                      isActive={
                        location.pathname === module.href ||
                        location.pathname.startsWith(`${module.href}/`)
                      }
                      render={<Link to={module.href} />}
                    >
                      <module.icon />
                      <span>{module.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {user.role === "admin" && (
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Waitlist approvals"
                      isActive={location.pathname === "/dashboard/waitlist"}
                      render={<Link to="/dashboard/waitlist" />}
                    >
                      <MailCheckIcon />
                      <span>Waitlist approvals</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Feature flags"
                      isActive={
                        location.pathname === "/dashboard/feature-flags"
                      }
                      render={<Link to="/dashboard/feature-flags" />}
                    >
                      <FlagIcon />
                      <span>Feature flags</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Settings"
                    isActive={location.pathname === "/dashboard/settings"}
                    render={<Link to="/dashboard/settings" />}
                  >
                    <SettingsIcon />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t">
          <div className="flex items-center gap-2 overflow-hidden p-1">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium uppercase">
              {user.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-xs font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={signOut}
              className="group-data-[collapsible=icon]:hidden"
            >
              <LogOutIcon />
              <span className="sr-only">Sign out</span>
            </Button>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-px bg-border" />
          <h1 className="text-sm font-medium">{title}</h1>
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
