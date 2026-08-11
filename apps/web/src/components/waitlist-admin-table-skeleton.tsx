import { Skeleton } from "@trackfi/ui/components/skeleton"
import { TableCell, TableRow } from "@trackfi/ui/components/table"

export function WaitlistAdminTableSkeleton() {
  return Array.from({ length: 5 }, (_, rowIndex) => (
    <TableRow key={rowIndex}>
      <TableCell>
        {rowIndex === 0 && (
          <span className="sr-only" role="status" aria-label="Loading waitlist">
            Loading waitlist
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
