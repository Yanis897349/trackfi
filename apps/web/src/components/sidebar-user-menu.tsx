import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import {
  BellIcon,
  ChevronDownIcon,
  LogOutIcon,
  Settings2Icon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@trackfi/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@trackfi/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@trackfi/ui/components/sidebar"
import { cn } from "@trackfi/ui/lib/utils"

import type { CurrentUser } from "../lib/api"
import { m } from "../lib/i18n"
import {
  formatUnreadNotificationCount,
  unreadNotificationCountQueryOptions,
} from "../lib/notifications"

function UnreadCountBadge({
  className,
  count,
}: {
  className?: string
  count: number
}) {
  if (count === 0) return null

  return (
    <span
      data-slot="unread-count-badge"
      className={cn(
        "flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] leading-5 font-semibold text-background tabular-nums",
        className
      )}
    >
      {formatUnreadNotificationCount(count)}
    </span>
  )
}

export function SidebarUserMenu({
  onSignOut,
  user,
}: {
  onSignOut: () => Promise<void>
  user: CurrentUser
}) {
  const { isMobile, setOpenMobile, state } = useSidebar()
  const unread = useQuery(unreadNotificationCountQueryOptions())
  const unreadCount = unread.data?.unreadCount ?? 0
  const userInitial = user.name.slice(0, 1).toUpperCase()
  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false)
  }
  const triggerLabel = `${m.nav_user_menu()}. ${m.notifications_unread_badge_label({ count: unreadCount })}`

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                aria-label={triggerLabel}
                className="relative h-14 gap-2.5 rounded-lg border border-sidebar-border bg-sidebar-accent/70 p-[7px] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0! data-popup-open:bg-sidebar-accent"
              />
            }
          >
            <Avatar className="size-[34px] rounded-[9px] group-data-[collapsible=icon]:size-8 after:rounded-[9px]">
              <AvatarFallback className="rounded-[9px] bg-background text-[13px] font-bold text-foreground">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 gap-0.5 text-left leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-[13px] font-semibold">
                {user.name}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {m.nav_personal_account()}
              </span>
            </div>
            <UnreadCountBadge
              count={unreadCount}
              className="group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:-top-1 group-data-[collapsible=icon]:-right-1 group-data-[collapsible=icon]:min-w-4 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:text-[9px] group-data-[collapsible=icon]:leading-4"
            />
            <ChevronDownIcon className="ml-0 size-4 text-muted-foreground transition-transform group-aria-expanded/menu-button:rotate-180 group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-68 gap-1 rounded-[10px] p-2"
            side={isMobile ? "bottom" : state === "collapsed" ? "right" : "top"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2.5 px-1.5 py-[7px] text-left">
                  <Avatar className="size-[34px] rounded-[9px] after:rounded-[9px]">
                    <AvatarFallback className="rounded-[9px] bg-muted text-[13px] font-bold text-foreground">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 gap-0.5 leading-tight">
                    <span className="truncate text-[13px] font-semibold text-foreground">
                      {user.name}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="h-9 gap-2.5 px-2 text-[13px] font-medium"
                render={<Link to="/dashboard/notifications" />}
                onClick={closeMobileSidebar}
              >
                <BellIcon />
                <span>{m.notifications()}</span>
                <UnreadCountBadge count={unreadCount} className="ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem
                className="h-9 gap-2.5 px-2 text-[13px] font-medium"
                render={<Link to="/dashboard/settings" />}
                onClick={closeMobileSidebar}
              >
                <Settings2Icon />
                <span>{m.nav_settings()}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="h-9 gap-2.5 px-2 text-[13px] font-medium"
              onClick={() => void onSignOut()}
            >
              <LogOutIcon />
              <span>{m.nav_sign_out()}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
