import { FileCheck2Icon, FileQuestionIcon } from "lucide-react"

import { API_URL } from "../lib/api"
import { formatShortDateOnly } from "../lib/date"
import type { Expense } from "../lib/expenses"
import { displayLabel, formatMoney } from "../lib/subscriptions"
import { Badge } from "@trackfi/ui/components/badge"
import { buttonVariants } from "@trackfi/ui/components/button"
import { Card, CardContent, CardFooter } from "@trackfi/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@trackfi/ui/components/table"
import { cn } from "@trackfi/ui/lib/utils"

import { ExpenseActions, type ExpenseListActions } from "./expense-actions"
import { SubscriptionPagination } from "./subscription-list-parts"

export function ExpenseList({
  expenses,
  currency,
  page,
  total,
  onPageChange,
  ...actions
}: {
  expenses: Expense[]
  currency: string
  page: number
  total: number
  onPageChange(page: number): void
} & ExpenseListActions) {
  const shown = Math.min(page * 5, total)
  const pagination = {
    hasPrevious: page > 1,
    hasNext: shown < total,
    onPrevious: () => onPageChange(page - 1),
    onNext: () => onPageChange(page + 1),
  }
  return (
    <>
      <Card className="hidden gap-0 overflow-hidden rounded-[9px] py-0 md:flex">
        <Table className="text-[12px]">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Merchant</TableHead>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead className="w-[150px]">Category</TableHead>
              <TableHead className="w-[130px] text-right">Amount</TableHead>
              <TableHead className="w-[130px]">Status</TableHead>
              <TableHead className="w-[120px]">Receipt</TableHead>
              <TableHead className="w-14">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id} className="h-[58px]">
                <TableCell className="pl-4">
                  <Merchant expense={expense} />
                </TableCell>
                <TableCell>
                  {formatShortDateOnly(expense.transactionDate)}
                </TableCell>
                <TableCell>{displayLabel(expense.category)}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatMoney(expense.amountMinor, currency)}
                </TableCell>
                <TableCell>
                  <Status expense={expense} />
                </TableCell>
                <TableCell>
                  <Receipt expense={expense} alignToCell />
                </TableCell>
                <TableCell className="text-right">
                  <ExpenseActions expense={expense} {...actions} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <CardFooter className="h-12 justify-between px-4 py-0">
          <p className="text-[11px] text-muted-foreground">
            Showing {Math.max(0, shown - expenses.length + 1)}–{shown} of{" "}
            {total} transactions
          </p>
          <SubscriptionPagination {...pagination} />
        </CardFooter>
      </Card>
      <div className="grid gap-3 md:hidden">
        {expenses.map((expense) => (
          <Card key={expense.id} size="sm">
            <CardContent className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Merchant expense={expense} />
                <p className="mt-3 text-base font-semibold">
                  {formatMoney(expense.amountMinor, currency)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatShortDateOnly(expense.transactionDate)} ·{" "}
                  {displayLabel(expense.category)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Status expense={expense} />
                  <Receipt expense={expense} />
                </div>
              </div>
              <ExpenseActions expense={expense} {...actions} />
            </CardContent>
          </Card>
        ))}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {shown} of {total}
          </p>
          <SubscriptionPagination {...pagination} />
        </div>
      </div>
    </>
  )
}

function Merchant({ expense }: { expense: Expense }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
        {expense.merchant.slice(0, 1).toLocaleUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{expense.merchant}</p>
        {expense.notes && (
          <p className="truncate text-[11px] text-muted-foreground">
            {expense.notes}
          </p>
        )}
      </div>
    </div>
  )
}

function Status({ expense }: { expense: Expense }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Badge
        variant="outline"
        className="gap-1 border-transparent bg-muted px-2 text-[10px]"
      >
        <span
          className={`size-1.5 rounded-full ${statusColor(expense.status)}`}
        />
        {displayLabel(expense.status)}
      </Badge>
      {expense.reimbursable && (
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 px-2 text-[10px] text-emerald-700"
        >
          Reimbursable
        </Badge>
      )}
    </div>
  )
}

function Receipt({
  expense,
  alignToCell = false,
}: {
  expense: Expense
  alignToCell?: boolean
}) {
  return expense.receipt ? (
    <a
      className={cn(
        buttonVariants({ variant: "ghost", size: "xs" }),
        "h-6 px-1.5 text-[10px]",
        alignToCell && "-ml-1.5"
      )}
      href={`${API_URL}${expense.receipt.url}`}
      target="_blank"
      rel="noreferrer"
    >
      <FileCheck2Icon className="size-3.5" /> Attached
    </a>
  ) : (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <FileQuestionIcon className="size-3.5" /> Missing
    </span>
  )
}

function statusColor(status: Expense["status"]) {
  if (status === "approved") return "bg-emerald-500"
  if (status === "declined") return "bg-red-500"
  return "bg-amber-500"
}
