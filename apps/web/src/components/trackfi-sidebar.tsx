import type { ReactNode } from "react"
import { Link, useLocation } from "@tanstack/react-router"
import type { LucideIcon } from "lucide-react"
import { FlagIcon, LayoutDashboardIcon, MailCheckIcon } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@trackfi/ui/components/sidebar"
import { spring } from "@trackfi/ui/lib/springs"

import type { CurrentUser } from "../lib/api"
import { m } from "../lib/i18n"
import { modules } from "../modules"
import { SidebarUserMenu } from "./sidebar-user-menu"

const navigationButtonClass =
  "h-[38px] gap-[11px] rounded-[7px] px-2.5 font-medium text-[#3f3f46] transition-colors motion-reduce:transition-none data-active:font-semibold data-active:text-sidebar-accent-foreground dark:text-sidebar-foreground/80 [&>svg]:size-[17px] [&>svg]:text-muted-foreground data-active:[&>svg]:text-sidebar-accent-foreground"

type SidebarHref =
  | "/dashboard"
  | "/dashboard/expenses"
  | "/dashboard/feature-flags"
  | "/dashboard/revenue"
  | "/dashboard/subscriptions"
  | "/dashboard/waitlist"

function SidebarNavigationLink({
  href,
  icon: Icon,
  isActive,
  label,
}: {
  href: SidebarHref
  icon: LucideIcon
  isActive: boolean
  label: string
}) {
  const { isMobile, setOpenMobile } = useSidebar()
  const shouldReduceMotion = useReducedMotion()

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={label}
        isActive={isActive}
        className={navigationButtonClass}
        render={
          <Link to={href} activeOptions={{ exact: href === "/dashboard" }} />
        }
        onClick={() => {
          if (isMobile) setOpenMobile(false)
        }}
      >
        <Icon />
        <span>{label}</span>
      </SidebarMenuButton>
      {isActive && (
        <motion.span
          layoutId="trackfi-sidebar-active-indicator"
          data-slot="sidebar-active-indicator"
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 my-auto h-[18px] w-[3px] rounded-r-sm bg-sidebar-foreground"
          transition={shouldReduceMotion ? { duration: 0 } : spring.moderate}
        />
      )}
    </SidebarMenuItem>
  )
}

function NavigationGroup({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <SidebarGroup className="gap-1 p-0">
      <SidebarGroupLabel className="h-3 rounded-none px-0 text-[10px] font-semibold tracking-[0.08em] uppercase group-data-[collapsible=icon]:-mt-3!">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-[3px]">{children}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function CollapsedGroupSeparator() {
  return (
    <SidebarSeparator className="mx-1 hidden group-data-[collapsible=icon]:my-2.5 group-data-[collapsible=icon]:block data-horizontal:w-auto!" />
  )
}

export function TrackfiSidebar({
  onSignOut,
  user,
}: {
  onSignOut: () => Promise<void>
  user: CurrentUser
}) {
  const location = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-[84px] justify-center px-2.5 py-3 group-data-[collapsible=icon]:h-14 group-data-[collapsible=icon]:p-2">
        <div className="flex h-[60px] w-full items-center gap-2.5 overflow-hidden rounded-lg p-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-sidebar-primary text-[15px] font-bold text-sidebar-primary-foreground group-data-[collapsible=icon]:size-8">
            T
          </span>
          <span className="grid min-w-0 flex-1 gap-0.5 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-[15px] font-[650]">Trackfi</span>
            <span className="truncate text-[11px] text-muted-foreground">
              {m.nav_finance_workspace()}
            </span>
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-[18px] px-2.5 py-1 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-2">
        <NavigationGroup label={m.nav_workspace()}>
          <SidebarNavigationLink
            href="/dashboard"
            icon={LayoutDashboardIcon}
            label={m.nav_dashboard()}
            isActive={location.pathname === "/dashboard"}
          />
        </NavigationGroup>
        <CollapsedGroupSeparator />
        <NavigationGroup label={m.nav_modules()}>
          {modules.map((module) => (
            <SidebarNavigationLink
              key={module.id}
              href={module.href}
              icon={module.icon}
              label={module.label}
              isActive={
                location.pathname === module.href ||
                location.pathname.startsWith(`${module.href}/`)
              }
            />
          ))}
        </NavigationGroup>
        {user.role === "admin" && (
          <>
            <CollapsedGroupSeparator />
            <NavigationGroup label={m.nav_admin()}>
              <SidebarNavigationLink
                href="/dashboard/waitlist"
                icon={MailCheckIcon}
                label={m.nav_waitlist()}
                isActive={location.pathname === "/dashboard/waitlist"}
              />
              <SidebarNavigationLink
                href="/dashboard/feature-flags"
                icon={FlagIcon}
                label={m.nav_feature_flags()}
                isActive={location.pathname === "/dashboard/feature-flags"}
              />
            </NavigationGroup>
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="p-2.5 pb-3 group-data-[collapsible=icon]:px-2">
        <SidebarUserMenu user={user} onSignOut={onSignOut} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
