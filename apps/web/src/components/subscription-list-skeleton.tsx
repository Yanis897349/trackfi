import { Card, CardContent, CardFooter } from "@trackfi/ui/components/card"
import { Skeleton } from "@trackfi/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@trackfi/ui/components/table"

export function SubscriptionListSkeleton({
  label = "Loading services",
  announce = true,
}: {
  label?: string
  announce?: boolean
}) {
  return (
    <div
      role={announce ? "status" : undefined}
      aria-label={announce ? label : undefined}
      aria-busy={announce ? "true" : undefined}
      aria-hidden={announce ? undefined : "true"}
    >
      <Card className="hidden py-0 md:block">
        <Table className="text-[13px]">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Service</TableHead>
              <TableHead className="w-[150px]">Category</TableHead>
              <TableHead className="w-[180px]">Cost</TableHead>
              <TableHead className="w-[170px]">Next renewal</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-16">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }, (_, index) => (
              <TableRow key={index} className="h-[72px]">
                <TableCell className="pl-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="ml-auto size-7" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <CardFooter className="h-14 justify-between bg-card px-4 py-0">
          <Skeleton className="h-3 w-28" />
          <div className="flex gap-1.5">
            <Skeleton className="size-8" />
            <Skeleton className="size-8" />
          </div>
        </CardFooter>
      </Card>
      <div className="grid gap-3 md:hidden">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index} size="sm">
            <CardContent className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="size-7" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
