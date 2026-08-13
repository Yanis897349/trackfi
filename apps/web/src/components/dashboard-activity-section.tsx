import { Link } from "@tanstack/react-router"
import { CalendarRangeIcon } from "lucide-react"

import { buttonVariants } from "@trackfi/ui/components/button"
import { Card } from "@trackfi/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@trackfi/ui/components/table"
import { cn } from "@trackfi/ui/lib/utils"

import type { DashboardOverview } from "../lib/dashboard"
import { dashboardModuleLabel } from "../lib/dashboard-labels"
import { formatShortDateOnly } from "../lib/date"
import { m } from "../lib/i18n"
import {
  DashboardActivityAmount,
  DashboardActivityStatus,
} from "./dashboard-activity-parts"
import { NotificationHistoryPagination } from "./notification-history-pagination"

export function DashboardActivitySection({
  overview,
  currency,
  onPageChange,
}: {
  overview: DashboardOverview
  currency: string
  onPageChange(page: number): void
}) {
  const { activity } = overview
  const totalPages = Math.max(1, Math.ceil(activity.total / activity.pageSize))
  const first = activity.total ? (activity.page - 1) * activity.pageSize + 1 : 0
  const last = Math.min(activity.page * activity.pageSize, activity.total)
  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-xs">
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold">
            {m.dashboard_upcoming_activity()}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {m.dashboard_upcoming_activity_description()}
          </p>
        </div>
        <Link
          to="/dashboard/calendar"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-fit"
          )}
        >
          <CalendarRangeIcon /> {m.dashboard_view_calendar()}
        </Link>
      </div>
      {activity.items.length ? (
        <>
          <DesktopActivityTable activity={activity} currency={currency} />
          <MobileActivityList activity={activity} currency={currency} />
        </>
      ) : (
        <div className="border-t px-5 py-10 text-center text-sm text-muted-foreground">
          {m.dashboard_no_activity()}
        </div>
      )}
      <footer
        data-slot="dashboard-activity-footer"
        className="flex min-h-[52px] flex-col gap-2 border-t px-5 py-2.5 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="text-xs text-muted-foreground">
          {m.dashboard_pagination_summary({
            first,
            last,
            total: activity.total,
          })}
        </p>
        <NotificationHistoryPagination
          page={activity.page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </footer>
    </Card>
  )
}

function DesktopActivityTable({
  activity,
  currency,
}: {
  activity: DashboardOverview["activity"]
  currency: string
}) {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{m.dashboard_activity_date()}</TableHead>
            <TableHead>{m.dashboard_activity_item()}</TableHead>
            <TableHead>{m.dashboard_activity_module()}</TableHead>
            <TableHead>{m.dashboard_activity_amount()}</TableHead>
            <TableHead>{m.common_status()}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activity.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {formatShortDateOnly(item.date)}
              </TableCell>
              <TableCell className="font-semibold">{item.label}</TableCell>
              <TableCell className="text-muted-foreground">
                {dashboardModuleLabel(item.module)}
              </TableCell>
              <TableCell>
                <DashboardActivityAmount activity={item} currency={currency} />
              </TableCell>
              <TableCell>
                <DashboardActivityStatus activity={item} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function MobileActivityList({
  activity,
  currency,
}: {
  activity: DashboardOverview["activity"]
  currency: string
}) {
  return (
    <div className="divide-y border-t md:hidden">
      {activity.items.map((item) => (
        <div key={item.id} className="space-y-2 px-5 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{item.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatShortDateOnly(item.date)} ·{" "}
                {dashboardModuleLabel(item.module)}
              </p>
            </div>
            <DashboardActivityAmount activity={item} currency={currency} />
          </div>
          <DashboardActivityStatus activity={item} />
        </div>
      ))}
    </div>
  )
}
