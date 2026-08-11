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

interface WaitlistAdminTableProps {
  entries: WaitlistEntry[]
  invitationPending: boolean
  isLoading: boolean
  onInvitation: (input: { action: "approve" | "resend"; id: string }) => void
  status: WaitlistStatus | "all"
}

const columnHelper = createColumnHelper<WaitlistEntry>()

export function WaitlistAdminTable({
  entries,
  invitationPending,
  isLoading,
  onInvitation,
  status,
}: WaitlistAdminTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("email", {
        header: "Email",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor("created_at", {
        header: "Joined",
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor("invite_delivery_status", {
        header: "Invitation",
        cell: (info) => info.getValue().replace("_", " "),
      }),
      columnHelper.display({
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
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
                {entry.status === "pending" ? "Approve" : "Resend invite"}
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
        <CardTitle>Emails</CardTitle>
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
          <TableBody aria-busy={isLoading}>
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
                  No {status === "all" ? "waitlist" : status} entries.
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
      {status}
    </Badge>
  )
}
