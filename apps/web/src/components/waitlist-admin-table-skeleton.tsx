import { Skeleton } from "@trackfi/ui/components/skeleton"
import { TableCell, TableRow } from "@trackfi/ui/components/table"
import { m } from "../lib/i18n"

export function WaitlistAdminTableSkeleton() {
  return Array.from({ length: 5 }, (_, rowIndex) => (
    <TableRow key={rowIndex}>
      <TableCell>
        {rowIndex === 0 && (
          <span
            className="sr-only"
            role="status"
            aria-label={m.admin_loading_waitlist()}
          >
            {m.admin_loading_waitlist()}
          </span>
        )}
        <Skeleton className="h-4 w-40" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-20 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="ml-auto h-7 w-20" />
      </TableCell>
    </TableRow>
  ))
}
