import { useMemo } from "react"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Badge } from "@trackfi/ui/components/badge"
import { Button } from "@trackfi/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@trackfi/ui/components/table"

import { formatDate } from "../lib/date"
import type { WaitlistEntry, WaitlistStatus } from "../lib/waitlist"
import { WaitlistAdminTableSkeleton } from "./waitlist-admin-table-skeleton"
import { m } from "../lib/i18n"
import { statusLabel } from "../lib/labels"

interface WaitlistAdminTableProps {
  entries: WaitlistEntry[]
  invitationPending: boolean
  isLoading: boolean
  isLoadingVisible: boolean
  onInvitation: (input: { action: "approve" | "resend"; id: string }) => void
}

const columnHelper = createColumnHelper<WaitlistEntry>()

export function WaitlistAdminTable({
  entries,
  invitationPending,
  isLoading,
  isLoadingVisible,
  onInvitation,
}: WaitlistAdminTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("email", {
        header: m.admin_email(),
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor("created_at", {
        header: m.admin_joined(),
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor("status", {
        header: m.common_status(),
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor("invite_delivery_status", {
        header: m.admin_invitation(),
        cell: (info) => deliveryLabel(info.getValue()),
      }),
      columnHelper.display({
        id: "actions",
        header: () => <span className="sr-only">{m.common_actions()}</span>,
        cell: ({ row }) => {
          const entry = row.original
          if (entry.status === "registered") return null
          return (
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant={entry.status === "pending" ? "default" : "outline"}
                disabled={invitationPending}
                onClick={() =>
                  onInvitation({
                    id: entry.id,
                    action: entry.status === "pending" ? "approve" : "resend",
                  })
                }
              >
                {entry.status === "pending"
                  ? m.admin_approve()
                  : m.admin_resend_invite()}
              </Button>
            </div>
          )
        },
      }),
    ],
    [invitationPending, onInvitation]
  )
  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{m.admin_waitlist_emails()}</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            aria-busy={isLoadingVisible || undefined}
            aria-hidden={isLoading && !isLoadingVisible ? true : undefined}
            className={isLoading && !isLoadingVisible ? "invisible" : undefined}
          >
            {isLoading ? (
              <WaitlistAdminTableSkeleton />
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {m.admin_no_entries()}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: WaitlistStatus }) {
  return (
    <Badge variant={status === "pending" ? "secondary" : "outline"}>
      {statusLabel(status)}
    </Badge>
  )
}

function deliveryLabel(value: WaitlistEntry["invite_delivery_status"]) {
  const labels = {
    not_sent: m.admin_delivery_not_sent,
    sending: m.admin_delivery_sending,
    sent: m.admin_delivery_sent,
    failed: m.admin_delivery_failed,
  }
  return labels[value]?.() ?? m.common_unknown()
}
